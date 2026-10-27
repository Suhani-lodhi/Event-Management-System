import prisma from "../../index.js";

const getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const toInt = (v) => (v === undefined || v === "" ? undefined : Number(v));
    const eventId = toInt(req.query.eventId);
    const sessionId = toInt(req.query.sessionId);
    const seatCategoryId = toInt(req.query.seatCategoryId);

    for (const v of [eventId, sessionId, seatCategoryId]) {
      if (v !== undefined && !Number.isInteger(v)) {
        return res.status(400).json({ msg: "invalid query parameter", success: false });
      }
    }

    const sessionWhere = {
      event: {organizerId : userId },
      ...(eventId !== undefined ? { eventId } : {}),
      ...(sessionId !== undefined ? { id: sessionId } : {}),
    };

    if (sessionId !== undefined) {
      const owned = await prisma.session.findFirst({
        where: sessionWhere,
        select: { id: true },
      });
      if (!owned) {
        return res.status(403).json({ message: "Session not found", success: false });
      }
    }

    const scpWhere = {
      session: sessionWhere,
      ...(seatCategoryId !== undefined ? { seatCategoryId } : {}),
    };

    const ticketWhere = {
      status: { in: ["CONFIRMED", "CANCELLED"] },
      sessionCategoryPrice: scpWhere,                       // FIX 1: spelling
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
        _sum: { unitPrice: true },                          // FIX 2: spelling
      }),

      prisma.booking.groupBy({                              // FIX 3: this query was missing
        by: ["status"],
        where: {
          status: { in: ["CONFIRMED", "PARTIALLY_CANCELLED", "CANCELLED"] },
          ticket: { some: ticketWhere },
        },
        _count: { _all: true },
      }),

      prisma.cancellation.count({
        where: { tickets: { some: { sessionCategoryPrice: scpWhere } } },   // FIX 1: spelling
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
          seatsForSale: true,                               // FIX 4: spelling
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
      bookingGroups.find((g) => g.status === s)?._count._all ?? 0;   // FIX 5: _count._all
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
        price: Number(c.price),                             // FIX 6: Decimal -> number
        ticketsBooked: activeCount + cancelledCount,
        ticketsActive: activeCount,
        ticketsCancelled: cancelledCount,
        revenue: num(active?._sum?.unitPrice),
        remaining: c.seatsForSale,
      };
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

export {
getBookingStats
}