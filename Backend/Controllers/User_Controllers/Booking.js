
// const cancelBooking = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const bookingId = Number(req.params.id);

//     if (!Number.isInteger(bookingId))
//       return res.status(400).json({ message: "Invalid booking id" });

//     const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (booking.status === "CONFIRMED")
//       return res.status(409).json({ message: "A paid booking cannot be cancelled here" });

//     // already cancelled or expired: treat as success so repeated calls are harmless
//     if (booking.status !== "PENDING")
//       return res.status(200).json({ message: "Booking already closed" });

//     await prisma.$transaction([
//       prisma.booking.updateMany({
//         where: { id: bookingId, status: "PENDING" },   // never overwrites a booking paid a moment ago
//         data: { status: "CANCELLED" },
//       }),
//       prisma.tickets.updateMany({
//         where: { bookingId, status: "PENDING" },
//         data: { status: "CANCELLED" },
//       }),
//     ]);

//     return res.status(200).json({ message: "Booking cancelled" });
//   } catch (err) {
//     console.error("cancelBooking error:", err);
//     return res.status(500).json({ message: "Could not cancel booking" });
//   }
// };




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

    if (!Number.isInteger(sessionId))
      return res.status(400).json({ message: "sessionId is required" });

    const order = await buildOrder(prisma, sessionId, items);
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

const getBookingsByUserId = async(req, res)=>{
   try{
     const userId = req.user.id;
     const booking = await prisma.booking.findMany({
      where: {userId},
      include: {ticket: true}
     })

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    return res.status(200).json({ booking });
   }
   catch(err){
    console.error("getBookings error:", err);
    return res.status(500).json({ message: "Could not fetch booking" });
   }
}

const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId))
      return res.status(400).json({ message: "Invalid booking id" });

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

export { getBookingSummary, payForBooking, getBookings, getBookingsByUserId };