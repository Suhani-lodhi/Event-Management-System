import prisma from "../../index.js";

const HOLD_MINUTES = 10;
const MAX_PER_CATEGORY = 10;
const MAX_PER_BOOKING = 20;
const MAX_PENDING_PER_USER = 3;

const createBooking = async (req, res) => {
  try {
    const userId = req.user.id; 
    const {sessionId, items} = req.body;
    // items = [{ sessionCategoryPriceId: 7, quantity: 2 }, ...]


    if (!Number.isInteger(sessionId))
      return res.status(400).json({ message: "sessionId is required" });

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Select at least one ticket" });


    const merged = new Map();
    for (const it of items) {
      const id = it?.sessionCategoryPriceId;
      const qty = it?.quantity;
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1)
        return res.status(400).json({ message: "Invalid category or quantity" });
      merged.set(id, (merged.get(id) || 0) + qty);
    }

    const lines = [...merged.entries()]
      .map(([sessionCategoryPriceId, quantity]) => ({ sessionCategoryPriceId, quantity }))
      .sort((a, b) => a.sessionCategoryPriceId - b.sessionCategoryPriceId); // fixed lock order

    const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);

    if (lines.some((l) => l.quantity > MAX_PER_CATEGORY))
      return res.status(400).json({ message: `Max ${MAX_PER_CATEGORY} tickets per category` });

    if (totalCount > MAX_PER_BOOKING)
      return res.status(400).json({ message: `Max ${MAX_PER_BOOKING} tickets per booking` });


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


      const categories = await tx.sessionCategoryPrice.findMany({
        where: { id: { in: lines.map((l) => l.sessionCategoryPriceId) }, sessionId },
        select: { id: true, price: true, alias: true },
      });
      if (categories.length !== lines.length)
        return { error: { status: 400, message: "One or more categories do not belong to this session" } };

      const categoryById = new Map(categories.map((c) => [c.id, c]));


      let totalAmount = new Prisma.Decimal(0);
      const ticketData = [];

      for (const { sessionCategoryPriceId, quantity } of lines) {
        const held = await tx.sessionCategoryPrice.updateMany({
          where: {
            id: sessionCategoryPriceId,
            sessionId,
            seatsForSale: { gte: quantity },
          },
          data: { seatsForSale: { decrement: quantity } },
        });

        if (held.count === 0) {

          const err = new Error(
            `Not enough tickets available in "${categoryById.get(sessionCategoryPriceId).alias}"`
          );
          err.code = "OUT_OF_STOCK";
          throw err;
        }

        const { price } = categoryById.get(sessionCategoryPriceId);
        totalAmount = totalAmount.add(price.mul(quantity));

        for (let i = 0; i < quantity; i++) {
          ticketData.push({ sessionCategoryPriceId, unitPrice: price, status: "PENDING" });
        }
      }


      const booking = await tx.booking.create({
        data: {
          userId,
          sessionId,
          status: "PENDING",
          totalAmount,
          totalCount,
          expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
          ticket: { create: ticketData },
        },
        include: { ticket: true },
      });

      return { booking };
    });

    if (result.error)
      return res.status(result.error.status).json({ message: result.error.message });

    return res.status(201).json({
      message: "Tickets held. Complete payment before the hold expires.",
      booking: result.booking,
    });
  } catch (err) {
    if (err.code === "OUT_OF_STOCK")
      return res.status(409).json({ message: err.message });

    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Could not create booking" });
  }
};

export {
    createBooking
}