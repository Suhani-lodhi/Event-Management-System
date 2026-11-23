import prisma from "../../index.js";
import { getBookingDetailService } from "../../Sevices/Organizer_Services/booking.service.js";
import { sendMessageError } from "../../utils/serviceError.js";
import StatusCodes from "http-status-codes"
const getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(req.query);
    //const toInt = (v) => (v === undefined || v === "" ? undefined : Number(v));
    const eventId = req.query.eventId;
    const sessionId = req.query.sessionId;
    const seatCategoryId = req.query.seatCategoryId;

    // for (const v of [eventId, sessionId, seatCategoryId]) {
    //   if (v === undefined) {
    //     return res.status(400).json({ msg: "invalid query parameter", success: false });
    //   }
    // }

    console.log("booking stats userId---->", userId)

    const sessionWhere = {
      ...(eventId !== '' ? { eventId } : {}),
      ...(sessionId !== '' ? { id: sessionId } : {}),
    };
    if (sessionId !== undefined) {
      const owned = await prisma.session.findFirst({
        where: sessionWhere,
        select: { id: true },
      });
      if (!owned) {
        return res.status(404).json({ message: "Session not found", success: false });
      }
    }


    const scpWhere = {
      session: sessionWhere,
      ...(seatCategoryId !== '' ? { seatCategoryId } : {}),
    };

    const ticketWhere = {
      status: { in: ["CONFIRMED", "CANCELLED"] },
      sessionCategoryPrice: scpWhere,
    };

    const [
      ticketGroups,
      bookingGroups,
      cancellationCount,
      remainingAgg,
      perCategoryTickets,
      categories,
    ] = await Promise.all([
      prisma.tickets.groupBy({
        by: ["status"],
        where: ticketWhere,
        _count: { _all: true },
        _sum: { unitPrice: true },
      }),

      prisma.booking.groupBy({
        by: ["status"],
        where: {
          status: { in: ["CONFIRMED", "PARTIALLY_CANCELLED", "CANCELLED"] },
          ticket: { some: ticketWhere },
        },
        _count: { _all: true },
      }),

      prisma.cancellation.count({
        where: { tickets: { some: { sessionCategoryPrice: scpWhere } } },
      }),

      prisma.sessionCategoryPrice.aggregate({
        where: scpWhere,
        _sum: { seatsForSale: true },
      }),

      prisma.tickets.groupBy({
        by: ["sessionCategoryPriceId", "status"],
        where: ticketWhere,
        _count: { _all: true },
        _sum: { unitPrice: true },
      }),

      prisma.sessionCategoryPrice.findMany({
        where: scpWhere,
        select: {
          id: true,
          sessionId: true,
          alias: true,
          price: true,
          seatsForSale: true,
          seatCategory: { select: { categoryName: true } },
        },
        orderBy: [{ sessionId: "asc" }, { id: "asc" }],
      }),
    ]);

    const num = (d) => Number(d ?? 0);
    const confirmed = ticketGroups.find((g) => g.status === "CONFIRMED");
    const cancelled = ticketGroups.find((g) => g.status === "CANCELLED");
    const activeTickets = confirmed?._count._all ?? 0;
    const cancelledTickets = cancelled?._count._all ?? 0;
    const netRevenue = num(confirmed?._sum?.unitPrice);
    const refundedAmount = num(cancelled?._sum?.unitPrice);
    const grossRevenue = netRevenue + refundedAmount;

    const bookingOf = (s) =>
      bookingGroups.find((g) => g.status === s)?._count._all ?? 0;
    const totalBookings = bookingGroups.reduce((sum, g) => sum + g._count._all, 0);
    const remainingTickets = remainingAgg._sum.seatsForSale ?? 0;

    const byCategory = categories.map((c) => {
      const row = perCategoryTickets.filter((g) => g.sessionCategoryPriceId === c.id);
      const active = row.find((g) => g.status === "CONFIRMED");
      const canc = row.find((g) => g.status === "CANCELLED");
      const activeCount = active?._count._all ?? 0;
      const cancelledCount = canc?._count._all ?? 0;

      return {
        sessionCategoryPriceId: c.id,
        sessionId: c.sessionId,
        alias: c.alias,
        categoryName: c.seatCategory?.categoryName,
        price: Number(c.price),
        ticketsBooked: activeCount + cancelledCount,
        ticketsActive: activeCount,
        ticketsCancelled: cancelledCount,
        revenue: num(active?._sum?.unitPrice),
        remaining: c.seatsForSale,
      };
    });


const bookingData = await prisma.booking.findMany({
  where: {
    status: { in: ["CONFIRMED", "PARTIALLY_CANCELLED", "CANCELLED"] },
  },
  include: {
    user: { select: { id: true, email: true } },
    cancellation: {
      select: {
        ticketCount: true,   
        refundAmount: true,
      },
    },
  },
});


const bookingDetails = bookingData.map((b)=>{
  console.log(b);
  return {
    id: b.userId,
    email: b.user.email,
    bookedAt: b.createdAt,
    totalTickets: b.totalCount,
    totalAmount: b.totalAmount,
    bookingId: b.id,
    status: b.status,
    ticketCancelled: b.cancellation[0]?.ticketCount,
    refundedAmount: b.cancellation[0]?.refundAmount
  }
});


    return res.status(200).json({
      success: true,
      filters: {
        eventId: eventId ?? null,
        sessionId: sessionId ?? null,
        seatCategoryId: seatCategoryId ?? null,
      },
      bookings: {
        total: totalBookings,
        confirmed: bookingOf("CONFIRMED"),
        partiallyCancelled: bookingOf("PARTIALLY_CANCELLED"),
        cancelled: bookingOf("CANCELLED"),
        bookingDetails
      },
      tickets: {
        booked: activeTickets + cancelledTickets,
        active: activeTickets,
        cancelled: cancelledTickets,
        remaining: remainingTickets,
        capacity: remainingTickets + activeTickets,
      },
      cancellation: {
        total: cancellationCount,
        refundedAmount,
      },
      revenue: {
        gross: grossRevenue,
        refunded: refundedAmount,
        net: netRevenue,
      },
      byCategory,
    });
  } catch (err) {
    console.error("getBookingStats error:", err);
    return res.status(500).json({ msg: "could not fetch booking stats", success: false });
  }
};



const getBookingByEmail = async (req, res) => {
  try {
    const userId = req.user.id;


    const eventId = req.query.eventId;
    const sessionId = req.query.sessionId;
    const email = req.query.email;

    console.log(eventId, sessionId, email);

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new Error("user not found with this email");
    }
    console.log(user);

    const bookings = await prisma.booking.findMany({
  where: {
    userId: user.id,
    sessionId,
    status: { in: ["CONFIRMED", "PARTIALLY_CANCELLED"] },              
    session: {
      id: sessionId,
      event: { id: eventId },
    },
  },
  orderBy: { createdAt: "desc" },
  select: {
    id: true,
    status: true,
    totalAmount: true,
    totalCount: true,
    createdAt: true,
    session: {
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        subVenue: {
          select: {
            id: true,
            subVenueName: true,
            venue: {
              select: {
                id: true,
                venueName: true,
                addressLine1: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
              },
            },
          },
        },
        event: {
          select: { id: true, Title: true, imageUrl: true },
        },
      },
    },
  },
});

    console.log(bookings);
    if (!bookings || bookings.length === 0) {
      throw new Error("No booking exist with this email in the selected event");
    }

      return res.status(200).json({
        bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        totalAmount: Number(b.totalAmount),
        totalCount: b.totalCount,
        bookedOn: b.createdAt,
        event: b.session.event,
        session: {
          id: b.session.id,
          startDateTime: b.session.startDateTime,
          endDateTime: b.session.endDateTime,
        },
        subVenue: b.session.subVenue,
      }))
      })

  }
  catch (err) {
    console.log(err);
     sendMessageError(res, err, err.message);
  }
}


const getBookingDetails = async (req, res) => {
  try {
    const data = await getBookingDetailService(req.user?.id, req.params.id);
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, err.message);
  }
};

export {
  getBookingStats,
  getBookingDetails,
  getBookingByEmail
}