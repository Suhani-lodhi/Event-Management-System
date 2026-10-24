import prisma from "../../index.js";

const MAX_PER_CATEGORY = 10;
const MAX_PER_BOOKING = 20;


const parseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0)
    return { error: "Select at least one ticket" };

  const merged = new Map();
  for (const it of items) {
    const id = it?.sessionCategoryPriceId;
    const qty = it?.quantity;
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1)
      return { error: "Invalid category or quantity" };
    merged.set(id, (merged.get(id) || 0) + qty);
  }


  const lines = [...merged.entries()]
    .map(([sessionCategoryPriceId, quantity]) => ({ sessionCategoryPriceId, quantity }))
    .sort((a, b) => a.sessionCategoryPriceId - b.sessionCategoryPriceId);

  const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.some((l) => l.quantity > MAX_PER_CATEGORY))
    return { error: `Max ${MAX_PER_CATEGORY} tickets per category` };
  if (totalCount > MAX_PER_BOOKING)
    return { error: `Max ${MAX_PER_BOOKING} tickets per booking` };

  return { lines, totalCount };
};


const buildOrder = async (db, sessionId, items) => {
  const parsed = parseItems(items);
  if (parsed.error) return { error: { status: 400, message: parsed.error } };
  const { lines, totalCount } = parsed;

  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session) return { error: { status: 404, message: "Session not found" } };

  const now = new Date();
  if (now < session.regStartDateTime || now > session.regEndDateTime)
    return { error: { status: 400, message: "Registration is not open for this session" } };

  const categories = await db.sessionCategoryPrice.findMany({
    where: { id: { in: lines.map((l) => l.sessionCategoryPriceId) }, sessionId },
    select: { id: true, alias: true, price: true, seatsForSale: true },
  });
  if (categories.length !== lines.length)
    return { error: { status: 400, message: "One or more categories do not belong to this session" } };

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let totalAmount = null;
  const orderLines = [];

  for (const { sessionCategoryPriceId, quantity } of lines) {
    const cat = categoryById.get(sessionCategoryPriceId);

    if (cat.seatsForSale < quantity)
      return { error: { status: 409, message: `Not enough tickets available in "${cat.alias}"` } };

    const subtotal = cat.price.mul(quantity);
    totalAmount = totalAmount ? totalAmount.add(subtotal) : subtotal;

    orderLines.push({
      sessionCategoryPriceId,
      alias: cat.alias,
      unitPrice: cat.price,  
      quantity,
      subtotal,               
    });
  }

  return { orderLines, totalCount, totalAmount };
};



const getBookingSummary = async (req, res) => {
  try {
    const { sessionId, items } = req.body;
    console.log("booking summary--------------> ", items);
    if (!Number.isInteger(sessionId))
      return res.status(400).json({ message: "sessionId is required" });

    const order = await buildOrder(prisma, sessionId, items);
    console.log(order);
    if (order.error) return res.status(order.error.status).json({ message: order.error.message });

    return res.status(200).json({
      sessionId,
      items: order.orderLines.map((l) => ({
        sessionCategoryPriceId: l.sessionCategoryPriceId,
        alias: l.alias,
        unitPrice: Number(l.unitPrice),
        quantity: l.quantity,
        subtotal: Number(l.subtotal),
      })),
      totalCount: order.totalCount,
      totalAmount: Number(order.totalAmount),
    });
  } catch (err) {
    console.error("getBookingSummary error:", err);
    return res.status(500).json({ message: "Could not generate booking summary" });
  }
};



const payForBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, items } = req.body;

    if (!Number.isInteger(sessionId))
      return res.status(400).json({ message: "sessionId is required" });

    const result = await prisma.$transaction(async (tx) => {
    
      const order = await buildOrder(tx, sessionId, items);
      if (order.error) return { error: order.error };

      
      for (const line of order.orderLines) {
        const r = await tx.sessionCategoryPrice.updateMany({
          where: {
            id: line.sessionCategoryPriceId,
            sessionId,
            seatsForSale: { gte: line.quantity },
          },
          data: { seatsForSale: { decrement: line.quantity } },
        });

        if (r.count === 0) {
         
          const err = new Error(`Tickets in "${line.alias}" just sold out`);
          err.code = "OUT_OF_STOCK";
          throw err;
        }
      }

      const ticketData = [];
      for (const line of order.orderLines) {
        for (let i = 0; i < line.quantity; i++) {
          ticketData.push({
            sessionCategoryPriceId: line.sessionCategoryPriceId,
            unitPrice: line.unitPrice,
            status: "CONFIRMED",
          });
        }
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          sessionId,
          status: "CONFIRMED",
          totalAmount: order.totalAmount,
          totalCount: order.totalCount,
          ticket: { create: ticketData },
        },
        select: { id: true },
      });

      return { bookingId: booking.id };
    });

    if (result.error)
      return res.status(result.error.status).json({ message: result.error.message });

    return res.status(201).json({ message: "Booking confirmed", bookingId: result.bookingId });
  } catch (err) {
    if (err.code === "OUT_OF_STOCK")
      return res.status(409).json({ message: err.message });

    console.error("payForBooking error:", err);
    return res.status(500).json({ message: "Could not complete booking" });
  }
};

const getBookingsByUserId = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const bookings = await prisma.booking.findMany({
      where: { userId },
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
            event: { select: { id: true, Title: true, imageUrl:true } },  
            subVenue:{
              select:{
                id:true,
                subVenueName:true,
                venue: {
                  select: {
                    id: true,
                    venueName: true,
                    addressLine1:true,
                    city:true,
                    state:true,
                    country: true,
                    pincode: true
                  }
                }
              }
            } 
          },
        },
      },
    });



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
      })),
    });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Could not fetch bookings" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });


    const { ticketIds } = req.body ?? {};

    console.log("cancel body:", JSON.stringify(req.body), "ticketIds:", ticketIds);


    if (ticketIds !== undefined) {
      if (
        !Array.isArray(ticketIds) ||
        ticketIds.length === 0 ||
        !ticketIds.every(Number.isInteger)
      )
        return res.status(400).json({ message: "Invalid ticketIds" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, userId },
        include: { session: true },
      });
      if (!booking) return { error: { status: 404, message: "Booking not found" } };

      if (booking.status === "CANCELLED")
        return { error: { status: 409, message: "Booking is already cancelled" } };

      // CHANGED: only CONFIRMED or PARTIALLY_CANCELLED bookings can be cancelled further
      if (!["CONFIRMED", "PARTIALLY_CANCELLED"].includes(booking.status))
        return { error: { status: 409, message: "This booking cannot be cancelled" } };

      if (new Date() >= booking.session.startDateTime)
        return { error: { status: 400, message: "This session has already started" } };

      const tickets = await tx.tickets.findMany({
        where: {
          bookingId,
          status: "CONFIRMED",
          ...(ticketIds ? { id: { in: ticketIds } } : {}),
        },
        select: { id: true, sessionCategoryPriceId: true, unitPrice: true },
      });

      if (tickets.length === 0)
        return { error: { status: 409, message: "No active tickets to cancel" } };

      if (ticketIds && tickets.length !== new Set(ticketIds).size)
        return {
          error: {
            status: 400,
            message: "Some tickets do not belong to this booking or are already cancelled",
          },
        };

      const claimed = await tx.tickets.updateMany({
        where: { id: { in: tickets.map((t) => t.id) }, status: "CONFIRMED" },
        data: { status: "CANCELLED" },
      });
      if (claimed.count !== tickets.length) {
        const err = new Error("Tickets were changed by another request. Please try again.");
        err.code = "CONFLICT";
        throw err;
      }

      const perCategory = new Map();
      let refundAmount = tickets[0].unitPrice.mul(0);
      for (const t of tickets) {
        perCategory.set(
          t.sessionCategoryPriceId,
          (perCategory.get(t.sessionCategoryPriceId) || 0) + 1
        );
        refundAmount = refundAmount.add(t.unitPrice);
      }

      const categoryIds = [...perCategory.keys()].sort((a, b) => a - b);
      for (const categoryId of categoryIds) {
        await tx.sessionCategoryPrice.update({
          where: { id: categoryId },
          data: { seatsForSale: { increment: perCategory.get(categoryId) } },
        });
      }

      // CHANGED: always update the booking status, never leave it as CONFIRMED
      const remaining = await tx.tickets.count({
        where: { bookingId, status: "CONFIRMED" },
      });
      const newStatus = remaining === 0 ? "CANCELLED" : "PARTIALLY_CANCELLED";

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      return {
        cancelledCount: tickets.length,
        refundAmount: Number(refundAmount),
        bookingStatus: newStatus,               // CHANGED: replaces bookingCancelled
      };
    });

    if (result.error)
      return res.status(result.error.status).json({ message: result.error.message });

    return res.status(200).json({
      message:
        result.bookingStatus === "CANCELLED"
          ? "Booking cancelled"
          : "Selected tickets cancelled",
      cancelledCount: result.cancelledCount,
      refundAmount: result.refundAmount,
      bookingStatus: result.bookingStatus,      
      bookingCancelled: result.bookingStatus === "CANCELLED", 
    });
  } catch (err) {
    if (err.code === "CONFLICT") return res.status(409).json({ message: err.message });
    console.error("cancelBooking error:", err);
    return res.status(500).json({ message: "Could not cancel booking" });
  }
};



const getTickets = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId }, // owner check built in
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
            event: { select: { id: true, Title: true, imageUrl: true, status: true } },
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
          },
        },
        ticket: {
          where: { status: "CONFIRMED" }, 
          orderBy: { id: "asc" },
          select: {
            id: true,
            status: true,
            unitPrice: true,
            sessionCategoryPrice: {
              select: {
                id: true,
                alias: true,
                seatCategory: {
                  select: { id: true, categoryName: true, categoryDetail: true },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const grouped = new Map();

    for (const t of booking.ticket) {
      const key = t.sessionCategoryPrice.id;
      const unitPrice = Number(t.unitPrice);

      let line = grouped.get(key);
      if (!line) {
        line = {
          sessionCategoryPriceId: key,
          alias: t.sessionCategoryPrice.alias,
          unitPrice,
          quantity: 0,
          subtotal: 0,
          ticketIds: [],
        };
        grouped.set(key, line);
      }

      line.quantity += 1;
      line.subtotal += unitPrice;
      line.ticketIds.push(t.id);
    }

    const ticketSummaryWithIds = [...grouped.values()]; 
    return res.status(200).json({
      booking: {
        id: booking.id,
        status: booking.status,
        totalAmount: Number(booking.totalAmount),
        totalCount: booking.totalCount,
        bookedOn: booking.createdAt,
      },
      event: booking.session.event,
      session: {
        id: booking.session.id,
        startDateTime: booking.session.startDateTime,
        endDateTime: booking.session.endDateTime,
      },
      subVenue: booking.session.subVenue,
      tickets: booking.ticket.map((t) => ({
        id: t.id,
        status: t.status,
        unitPrice: Number(t.unitPrice),
        alias: t.sessionCategoryPrice.alias,
        categoryName: t.sessionCategoryPrice.seatCategory?.categoryName,
        categoryDetail: t.sessionCategoryPrice.seatCategory?.categoryDetail,
        sessionCategoryPriceId: t.sessionCategoryPrice.id,
      })),
      ticketSummary: ticketSummaryWithIds, 
    });
  } catch (err) {
    console.error("getTickets error:", err);
    return res.status(500).json({ message: "Could not fetch Tickets" });
  }
};


export { getBookingSummary, payForBooking, getTickets, getBookingsByUserId, cancelBooking}