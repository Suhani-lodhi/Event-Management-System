import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import QRCode from "qrcode";
import { ServiceError, assertFound } from "../../utils/serviceError.js";
import {
  sendBookingEmail,
  sendCancellationEmail,
} from "../../utils/bookingEmail.js";
import { razorpay, verifySignature } from "../../utils/razorpay.js";
import {
  initiateRefund,
  publicRefundStatus,
  NO_PAYMENT_MSG,
} from "./refund.service.js";
import { parseSettings } from "../Organizer_Services/event.service.js";

const MAX_PER_CATEGORY = 10;
const MAX_PER_BOOKING = 20;

export const bad = (msg) => new ServiceError(msg, StatusCodes.BAD_REQUEST);
 export const conflict = (msg) => new ServiceError(msg, StatusCodes.CONFLICT);

const byId = (a, b) => String(a).localeCompare(String(b));

const parseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw bad("Select at least one ticket");
  }

  const merged = new Map();
  for (const it of items) {
    const id = it?.sessionCategoryPriceId;
    const qty = it?.quantity;
    if (!id || !Number.isInteger(qty) || qty < 1) {
      throw bad("Invalid category or quantity");
    }
    merged.set(id, (merged.get(id) || 0) + qty);
  }

  const lines = [...merged.entries()]
    .map(([sessionCategoryPriceId, quantity]) => ({
      sessionCategoryPriceId,
      quantity,
    }))
    .sort((a, b) => byId(a.sessionCategoryPriceId, b.sessionCategoryPriceId));

  const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.some((l) => l.quantity > MAX_PER_CATEGORY)) {
    throw bad(`Max ${MAX_PER_CATEGORY} tickets per category`);
  }
  if (totalCount > MAX_PER_BOOKING) {
    throw bad(`Max ${MAX_PER_BOOKING} tickets per booking`);
  }

  return { lines, totalCount };
};

const buildOrder = async (db, sessionId, items) => {
  const { lines, totalCount } = parseItems(items);

  const session = await db.session.findUnique({ where: { id: sessionId } });
  assertFound(session, "Session not found");

  const now = new Date();
  if (now < session.regStartdateTime || now > session.regEndDateTime) {
    throw bad("Registration is not open for this session");
  }

  const categories = await db.sessionCategoryPrice.findMany({
    where: {
      id: { in: lines.map((l) => l.sessionCategoryPriceId) },
      sessionId,
    },
    select: { id: true, alias: true, price: true, seatsForSale: true },
  });

  if (categories.length !== lines.length) {
    throw bad("One or more categories do not belong to this session");
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let totalAmount = null;
  const orderLines = [];

  for (const { sessionCategoryPriceId, quantity } of lines) {
    const cat = categoryById.get(sessionCategoryPriceId);

    if (cat.seatsForSale < quantity) {
      throw conflict(`Not enough tickets available in "${cat.alias}"`);
    }

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

const SESSION_SELECT = {
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
};

export const getBookingSummaryService = async ({ sessionId, items } = {}) => {
  console.log("getBookingSummaryService", sessionId)
  if (!sessionId) throw bad("sessionId is required");
  console.log("getBookingSummaryService", items)
  const order = await buildOrder(prisma, sessionId, items);

  return {
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
  };
};

export const getBookingsByUserIdService = async (userId) => {
  if (!userId) {
    throw new ServiceError("Not authenticated", StatusCodes.UNAUTHORIZED);
  }

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      totalCount: true,
      createdAt: true,
      cancellation: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ticketCount: true,
          refundAmount: true,
          refundRef: true,
          status: true,
          createdAt: true,
        },
      },
      session: {
        select: {
          ...SESSION_SELECT,
          event: { select: { id: true, Title: true, imageUrl: true } },
        },
      },
    },
  });

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      totalAmount: Number(b.totalAmount),
      totalCount: b.totalCount,
      bookedOn: b.createdAt,
      cancellations: b.cancellation.map((c) => ({
        id: c.id,
        ticketCount: c.ticketCount,
        refundAmount: Number(c.refundAmount),
        refundRef: c.refundRef, // Razorpay refund id, e.g. rfnd_Abc123
        refundStatus: publicRefundStatus(c.status, c.refundRef), // PENDING | PROCESSED | FAILED | NOT_APPLICABLE
        cancelledOn: c.createdAt,
      })),
      event: b.session.event,
      session: {
        id: b.session.id,
        startDateTime: b.session.startDateTime,
        endDateTime: b.session.endDateTime,
      },
      subVenue: b.session.subVenue,
    })),
  };
};

const summariseCancelledTickets = (tickets, settings) => {
  const perCategory = new Map();
  const cancelledLines = new Map();
  let refundAmount = tickets[0].unitPrice.mul(0);

  for (const t of tickets) {
    perCategory.set(
      t.sessionCategoryPriceId,
      (perCategory.get(t.sessionCategoryPriceId) || 0) + 1,
    );
    refundAmount = refundAmount.add(t.unitPrice);

    const line = cancelledLines.get(t.sessionCategoryPriceId) || {
      alias: t.sessionCategoryPrice.alias,
      unitPrice: Number(t.unitPrice),
      quantity: 0,
      subtotal: 0,
    };
    line.quantity += 1;
    line.subtotal += Number(t.unitPrice);
    cancelledLines.set(t.sessionCategoryPriceId, line);
  }

  // refund only the percentage the organizer set for this event
  // (if the setting is missing, refund 100%)
  const raw = settings?.booking?.refundPercentage;
  const percent =
    raw === null || raw === undefined || raw === "" ? NaN : Number(raw);
  const refundPercent = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : 100;
  refundAmount = refundAmount.mul(refundPercent).div(100).toDecimalPlaces(2);

  return { perCategory, cancelledLines, refundAmount };
};

export const cancelBookingService = async (userId, bookingId, ticketIds) => {
  if (!userId) {
    throw new ServiceError("Not authenticated", StatusCodes.UNAUTHORIZED);
  }
  if (!bookingId) throw bad("Invalid booking id");

  if (ticketIds !== undefined) {
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      throw bad("Invalid ticketIds");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId },
      include: { session: { include: { event: true } } },
    });
    assertFound(booking, "Booking not found");

    if (booking.status === "CANCELLED") {
      throw conflict("Booking is already cancelled");
    }

    if (!["CONFIRMED", "PARTIALLY_CANCELLED"].includes(booking.status)) {
      throw conflict("This booking cannot be cancelled");
    }

    if (new Date() >= booking.session.startDateTime) {
      throw bad("This session has already started");
    }

    const tickets = await tx.tickets.findMany({
      where: {
        bookingId,
        status: "CONFIRMED",
        ...(ticketIds ? { id: { in: ticketIds } } : {}),
      },
      select: {
        id: true,
        sessionCategoryPriceId: true,
        unitPrice: true,
        sessionCategoryPrice: { select: { alias: true } },
      },
    });

    if (tickets.length === 0) throw conflict("No active tickets to cancel");

    if (ticketIds && tickets.length !== new Set(ticketIds).size) {
      throw bad(
        "Some tickets do not belong to this booking or are already cancelled",
      );
    }

    const { perCategory, cancelledLines, refundAmount } =
      summariseCancelledTickets(
        tickets,
        parseSettings(booking.session.event.settings),
      );

    // the payment this booking was made with (none for bookings made before Razorpay)
    const payment = await tx.paymentOrder.findFirst({
      where: { bookingId, status: "PAID" },
      select: { paymentId: true, amount: true },
    });
    if (payment && Math.round(Number(refundAmount) * 100) > payment.amount) {
      throw conflict("Refund amount is more than the amount paid");
    }

    // one Cancellation row per cancel click; it also holds the refund id later
    const cancellation = await tx.cancellation.create({
      data: {
        bookingId,
        userId,
        ticketCount: tickets.length,
        refundAmount,
        status: "PENDING",
        ...(payment?.paymentId ? {} : { refundError: NO_PAYMENT_MSG }),
      },
      select: { id: true },
    });

    const claimed = await tx.tickets.updateMany({
      where: { id: { in: tickets.map((t) => t.id) }, status: "CONFIRMED" },
      data: { status: "CANCELLED", cancellationId: cancellation.id },
    });
    if (claimed.count !== tickets.length) {
      throw conflict(
        "Tickets were changed by another request. Please try again.",
      );
    }

    // give the seats back, always in the same order
    const categoryIds = [...perCategory.keys()].sort(byId);
    for (const categoryId of categoryIds) {
      await tx.sessionCategoryPrice.update({
        where: { id: categoryId },
        data: { seatsForSale: { increment: perCategory.get(categoryId) } },
      });
    }

    const remaining = await tx.tickets.count({
      where: { bookingId, status: "CONFIRMED" },
    });
    const newStatus = remaining === 0 ? "CANCELLED" : "PARTIALLY_CANCELLED";

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });

    return {
      cancellationId: cancellation.id,
      cancelledCount: tickets.length,
      refundAmount: Number(refundAmount),
      bookingCancelled: remaining === 0,
      cancelledLines: [...cancelledLines.values()],
      remainingCount: remaining,
      bookingStatus: newStatus,
    };
  });

  // The cancellation is saved. Now ask Razorpay for the money back.
  // (Never call an outside service inside a database transaction.)
  const refund = await initiateRefund(result.cancellationId);

  sendCancellationEmail(bookingId, {
    ...result,
    refundRef: refund.refundRef,
    refundStatus: refund.status,
  }).catch((e) => console.error("cancellation email failed:", e));

  return {
    message: result.bookingCancelled
      ? "Booking cancelled"
      : "Selected tickets cancelled",
    cancelledCount: result.cancelledCount,
    refundAmount: result.refundAmount,
    refundRef: refund.refundRef, // show this to the user
    refundStatus: refund.status, // PENDING | PROCESSED | FAILED
    bookingStatus: result.bookingStatus,
    bookingCancelled: result.bookingStatus === "CANCELLED",
  };
};

const groupTicketsByCategory = (tickets) => {
  const grouped = new Map();

  for (const t of tickets) {
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

  return [...grouped.values()];
};

// "2 x VIP" style summary of the tickets cancelled in one cancellation
const groupCancelledTickets = (tickets = []) => {
  const grouped = new Map();
  for (const t of tickets) {
    const alias = t.sessionCategoryPrice.alias;
    const unitPrice = Number(t.unitPrice);
    const key = `${alias}|${unitPrice}`;
    const line = grouped.get(key) || {
      alias,
      unitPrice,
      quantity: 0,
      subtotal: 0,
    };
    line.quantity += 1;
    line.subtotal += unitPrice;
    grouped.set(key, line);
  }
  return [...grouped.values()];
};

// total refund and number of cancelled tickets across all cancellations of a booking
const sumRefunds = (cancellations = []) =>
  cancellations.reduce(
    (acc, c) => ({
      refundAmount: acc.refundAmount + Number(c.refundAmount),
      cancelledTickets: acc.cancelledTickets + c.ticketCount,
    }),
    { refundAmount: 0, cancelledTickets: 0 },
  );

export const getRefundSummary = async (bookingId) => {
  const cancellations = await prisma.cancellation.findMany({
    where: { bookingId },
  });
  return sumRefunds(cancellations);
};

export const getTicketsService = async (userId, bookingId) => {
  if (!userId) {
    throw new ServiceError("Not authenticated", StatusCodes.UNAUTHORIZED);
  }
  if (!bookingId) throw bad("Invalid booking id");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId }, // owner check built in
    select: {
      id: true,
      status: true,
      totalAmount: true,
      totalCount: true,
      createdAt: true,
      cancellation: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ticketCount: true,
          refundAmount: true,
          refundRef: true,
          status: true,
          createdAt: true,
          tickets: {
            select: {
              unitPrice: true,
              sessionCategoryPrice: { select: { alias: true } },
            },
          },
        },
      },
      session: {
        select: {
          ...SESSION_SELECT,
          event: {
            select: {
              id: true,
              Title: true,
              imageUrl: true,
              status: true,
              settings: true,
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
                select: {
                  id: true,
                  categoryName: true,
                  categoryDetail: true,
                },
              },
            },
          },
        },
      },
    },
  });
  assertFound(booking, "Booking not found");
  const bookingQrCode = await QRCode.toDataURL(
    `http://localhost:5173/organizer/attendance/${booking.id}`,
  );

  return {
    booking: {
      id: booking.id,
      status: booking.status,
      totalAmount: Number(booking.totalAmount),
      totalCount: booking.totalCount,
      bookedOn: booking.createdAt,
      bookingQrCode: bookingQrCode,
    },
    event: booking.session.event,
    eventSettings: parseSettings(booking.session.event.settings),
    session: {
      id: booking.session.id,
      startDateTime: booking.session.startDateTime,
      endDateTime: booking.session.endDateTime,
      // 3 hours in milliseconds (was 3 * 60 * 60 * 100, which is only 18 minutes)
      canCancel:
        booking.session.startDateTime - Date.now() > 3 * 60 * 60 * 1000,
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
    ticketSummary: groupTicketsByCategory(booking.ticket),
    refundSummary: sumRefunds(booking.cancellation),
    cancellations: booking.cancellation.map((c) => ({
      id: c.id,
      items: groupCancelledTickets(c.tickets),
      ticketCount: c.ticketCount,
      refundAmount: Number(c.refundAmount),
      refundRef: c.refundRef,
      refundStatus: publicRefundStatus(c.status, c.refundRef),
      cancelledOn: c.createdAt,
    })),
  };
};

export const createPaymentOrderService = async (
  userId,
  { sessionId, items } = {},
) => {
  const summary = await getBookingSummaryService({ sessionId, items }); // price from DB
  const amount = Math.round(summary.totalAmount * 100); // paise

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `bk_${Date.now()}`,
  });

  await prisma.paymentOrder.create({
    data: { orderId: order.id, userId, sessionId, items, amount },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

// Creates the booking, reduces seats and creates tickets.
// Must be called inside a transaction: pass the transaction client as `tx`.
const bookTickets = async (tx, { userId, sessionId, items }) => {
  const order = await buildOrder(tx, sessionId, items);

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
      throw conflict(`Tickets in "${line.alias}" just sold out`);
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

  return {
    bookingId: booking.id,
    orderLines: order.orderLines,
    totalCount: order.totalCount,
    totalAmount: order.totalAmount,
  };
};

export const confirmPayment = async (orderId, paymentId) => {
  const pending = await prisma.paymentOrder.findUnique({ where: { orderId } });
  assertFound(pending, "Order not found");

  if (pending.status === "PAID") {
    return { message: "Booking confirmed", bookingId: pending.bookingId };
  }
  if (pending.status === "REFUNDED") {
    throw conflict("This payment was refunded");
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // "claim" the order; if someone else already did, count is 0
      const claimed = await tx.paymentOrder.updateMany({
        where: { orderId, status: "CREATED" },
        data: { status: "PAID", paymentId },
      });
      if (claimed.count === 0) return null;

      // FIX: bookTickets takes an object as its second argument
      const booked = await bookTickets(tx, {
        userId: pending.userId,
        sessionId: pending.sessionId,
        items: pending.items,
      });

      // price changed since the order was created?
      if (Math.round(Number(booked.totalAmount) * 100) !== pending.amount) {
        throw conflict("Ticket price changed. Please try again.");
      }

      await tx.paymentOrder.update({
        where: { orderId },
        data: { bookingId: booked.bookingId },
      });
      return booked;
    });
  } catch (err) {
    console.error("confirmPayment inner error:", err);

    // sold out / price changed / registration closed etc.: money was taken, so refund it
    if (err instanceof ServiceError) {
      try {
        await razorpay.payments.refund(paymentId, { amount: pending.amount });
        await prisma.paymentOrder.update({
          where: { orderId },
          data: { status: "REFUNDED" },
        });
      } catch (refundErr) {
        // don't hide the real reason; this payment needs a manual refund
        console.error("REFUND FAILED, refund manually:", paymentId, refundErr);
      }
      throw conflict(`${err.message}. Your payment will be refunded.`);
    }
    throw err; // real bug (DB down etc.): don't refund blindly
  }

  // the other request (browser or webhook) booked it first
  if (!result) {
    const again = await prisma.paymentOrder.findUnique({ where: { orderId } });
    return { message: "Booking confirmed", bookingId: again.bookingId };
  }

  sendBookingEmail(result).catch((e) =>
    console.error("booking email failed:", e),
  );
  return { message: "Booking confirmed", bookingId: result.bookingId };
};

export const payForBookingService = async (userId, body = {}) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  const ok = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) throw bad("Payment verification failed");

  const pending = await prisma.paymentOrder.findUnique({
    where: { orderId: razorpay_order_id },
  });
  assertFound(pending, "Order not found");
  if (pending.userId !== userId) {
    throw new ServiceError("Invalid order", StatusCodes.FORBIDDEN);
  }

  return confirmPayment(razorpay_order_id, razorpay_payment_id);
};
