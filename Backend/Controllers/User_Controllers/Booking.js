import prisma from "../../index.js";


const PAYMENT_WINDOW_MINUTES = 0.5;
const MAX_PER_CATEGORY = 10;
const MAX_PER_BOOKING = 20;
const MAX_PENDING_PER_USER = 3;

const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, items } = req.body;
    // items = [{ sessionCategoryPriceId: 7, quantity: 2 }, ...]

    if (!Number.isInteger(sessionId))
      return res.status(400).json({ message: "sessionId is required" });

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Select at least one ticket" });

    // merge duplicate categories
    const merged = new Map();
    for (const it of items) {
      const id = it?.sessionCategoryPriceId;
      const qty = it?.quantity;
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1)
        return res.status(400).json({ message: "Invalid category or quantity" });
      merged.set(id, (merged.get(id) || 0) + qty);
    }

    const lines = [...merged.entries()].map(([sessionCategoryPriceId, quantity]) => ({
      sessionCategoryPriceId,
      quantity,
    }));

    const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);

    if (lines.some((l) => l.quantity > MAX_PER_CATEGORY))
      return res.status(400).json({ message: `Max ${MAX_PER_CATEGORY} tickets per category` });

    if (totalCount > MAX_PER_BOOKING)
      return res.status(400).json({ message: `Max ${MAX_PER_BOOKING} tickets per booking` });

    // limit how many unpaid bookings one user can create
    const pending = await prisma.booking.count({
      where: { userId, status: "PENDING", expiresAt: { gt: new Date() } },
    });
    if (pending >= MAX_PENDING_PER_USER)
      return res.status(429).json({ message: "Complete or cancel your pending bookings first" });

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({ where: { id: sessionId } });
      if (!session) return { error: { status: 404, message: "Session not found" } };

      const now = new Date();
      if (now < session.regStartDateTime || now > session.regEndDateTime)
        return { error: { status: 400, message: "Registration is not open for this session" } };

      // prices come from the DB; categories must belong to this session
      const categories = await tx.sessionCategoryPrice.findMany({
        where: { id: { in: lines.map((l) => l.sessionCategoryPriceId) }, sessionId },
        select: { id: true, price: true, alias: true, seatsForSale: true },
      });
      if (categories.length !== lines.length)
        return { error: { status: 400, message: "One or more categories do not belong to this session" } };

      const categoryById = new Map(categories.map((c) => [c.id, c]));

      let totalAmount = null;
      const ticketData = [];

      for (const { sessionCategoryPriceId, quantity } of lines) {
        const cat = categoryById.get(sessionCategoryPriceId);

        // early check only. Nothing is reserved, so stock can still change before payment
        if (cat.seatsForSale < quantity)
          return { error: { status: 409, message: `Not enough tickets available in "${cat.alias}"` } };

        const lineTotal = cat.price.mul(quantity);
        totalAmount = totalAmount ? totalAmount.add(lineTotal) : lineTotal;

        for (let i = 0; i < quantity; i++) {
          ticketData.push({ sessionCategoryPriceId, unitPrice: cat.price, status: "PENDING" });
        }
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          sessionId,
          status: "PENDING",
          totalAmount,
          totalCount,
          expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000),
          ticket: { create: ticketData },
        },
        include: { ticket: true },
      });

      return { booking };
    });

    if (result.error)
      return res.status(result.error.status).json({ message: result.error.message });

    return res.status(201).json({
      message: `Booking created. Complete payment within ${PAYMENT_WINDOW_MINUTES} minutes.`,
      booking: result.booking,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Could not create booking" });
  }
};

const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = Number(req.params.id);


    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId }, 
      include: { ticket: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    return res.status(200).json({ booking });
  } catch (err) {
    console.error("getBookings error:", err);
    return res.status(500).json({ message: "Could not fetch booking" });
  }
};


const getBookingSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId }, 
      include: {
        ticket: {
          include: {
            sessionCategoryPrice: { select: { alias: true } },
          },
        },
      },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // group the one-row-per-ticket data into category lines
    const grouped = new Map();
    for (const t of booking.ticket) {
      const line = grouped.get(t.sessionCategoryPriceId) || {
        sessionCategoryPriceId: t.sessionCategoryPriceId,
        alias: t.sessionCategoryPrice.alias,
        unitPrice: Number(t.unitPrice),
        quantity: 0,
        subtotal: 0,
      };
      line.quantity += 1;
      line.subtotal += Number(t.unitPrice);
      grouped.set(t.sessionCategoryPriceId, line);
    }

    // hold status, for a countdown on the payment page
    const expiresAtMs = booking.expiresAt ? booking.expiresAt.getTime() : null;
    const isExpired =
      booking.status === "EXPIRED" ||
      (booking.status === "PENDING" && expiresAtMs !== null && expiresAtMs < Date.now());
    const secondsLeft =
      booking.status === "PENDING" && expiresAtMs !== null
        ? Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
        : 0;

    return res.status(200).json({
      bookingId: booking.id,
      sessionId: booking.sessionId,
      status: booking.status,
      items: [...grouped.values()],      // [{ alias, unitPrice, quantity, subtotal }]
      totalCount: booking.totalCount,
      totalAmount: Number(booking.totalAmount),
      isExpired,
      secondsLeft,
      createdAt: booking.createdAt,
    });
  } catch (err) {
    console.error("getBookingSummary error:", err);
    return res.status(500).json({ message: "Could not fetch booking summary" });
  }
};


const payBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({ where: { id: bookingId, userId } });
      if (!booking) return { error: { status: 404, message: "Booking not found" } };

      if (booking.status === "CONFIRMED")
        return { error: { status: 409, message: "This booking is already paid" } };

      if (booking.status !== "PENDING")
        return { error: { status: 410, message: "This booking is no longer valid" } };

      // payment window over: mark expired (returning normally commits this update, which is intended)
      if (booking.expiresAt && booking.expiresAt < new Date()) {
        await tx.booking.update({ where: { id: bookingId }, data: { status: "EXPIRED" } });
        await tx.tickets.updateMany({ where: { bookingId }, data: { status: "EXPIRED" } });
        return { error: { status: 410, message: "Payment time expired. Please select tickets again." } };
      }

      // registration still open?
      const session = await tx.session.findUnique({ where: { id: booking.sessionId } });
      const now = new Date();
      if (now < session.regStartDateTime || now > session.regEndDateTime)
        return { error: { status: 400, message: "Registration is closed for this session" } };

      // claim the booking: only one request can move PENDING -> CONFIRMED (safe against double clicks)
      const claimed = await tx.booking.updateMany({
        where: { id: bookingId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (claimed.count === 0)
        return { error: { status: 409, message: "Booking is already being processed" } };

      // now decrement stock per category, atomically
      const counts = await tx.tickets.groupBy({
        by: ["sessionCategoryPriceId"],
        where: { bookingId },
        _count: { _all: true },
      });
      counts.sort((a, b) => a.sessionCategoryPriceId - b.sessionCategoryPriceId); // fixed order, no deadlocks

      for (const c of counts) {
        const r = await tx.sessionCategoryPrice.updateMany({
          where: { id: c.sessionCategoryPriceId, seatsForSale: { gte: c._count._all } },
          data: { seatsForSale: { decrement: c._count._all } },
        });
        if (r.count === 0) {
          const err = new Error("Some tickets were sold out while you were paying");
          err.code = "SOLD_OUT";
          throw err; // rolls back the claim and every decrement so far
        }
      }

      await tx.tickets.updateMany({ where: { bookingId }, data: { status: "CONFIRMED" } });
      return { ok: true };
    });

    if (result.error)
      return res.status(result.error.status).json({ message: result.error.message });

    return res.status(200).json({ message: "Booking confirmed", bookingId });
  } catch (err) {
    if (err.code === "SOLD_OUT") {
      // the transaction rolled back, so mark the booking as failed (no real payment taken, nothing to refund)
      await prisma.booking.updateMany({
        where: { id: Number(req.params.id), status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      await prisma.tickets.updateMany({
        where: { bookingId: Number(req.params.id) },
        data: { status: "CANCELLED" },
      });
      return res.status(409).json({ message: err.message });
    }
    console.error("payBooking error:", err);
    return res.status(500).json({ message: "Could not complete booking" });
  }
};


const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });

    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "CONFIRMED")
      return res.status(409).json({ message: "A paid booking cannot be cancelled here" });

    // already cancelled or expired: treat as success so repeated calls are harmless
    if (booking.status !== "PENDING")
      return res.status(200).json({ message: "Booking already closed" });

    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id: bookingId, status: "PENDING" },   // never overwrites a booking paid a moment ago
        data: { status: "CANCELLED" },
      }),
      prisma.tickets.updateMany({
        where: { bookingId, status: "PENDING" },
        data: { status: "CANCELLED" },
      }),
    ]);

    return res.status(200).json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("cancelBooking error:", err);
    return res.status(500).json({ message: "Could not cancel booking" });
  }
};




export {
    createBooking,
    getBookings,
    getBookingSummary,
    payBooking,
    cancelBooking
}