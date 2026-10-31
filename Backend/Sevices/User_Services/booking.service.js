import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import { ServiceError, assertFound } from "../../utils/serviceError.js";
import {
  sendBookingEmail,
  sendCancellationEmail,
} from "../../utils/bookingEmail.js";

const MAX_PER_CATEGORY = 10;
const MAX_PER_BOOKING = 20;

const bad = (msg) => new ServiceError(msg, StatusCodes.BAD_REQUEST);
const conflict = (msg) => new ServiceError(msg, StatusCodes.CONFLICT);

// ids are UUID strings, so they are compared as text (not with a - b)
const byId = (a, b) => String(a).localeCompare(String(b));

/* ---------------------------------------------------------------
   Shared helpers
---------------------------------------------------------------- */

// checks the tickets the user sent and returns them as clean lines
const parseItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw bad("Select at least one ticket");
  }

  // the same category sent twice -> add the quantities together
  const merged = new Map();
  for (const it of items) {
    const id = it?.sessionCategoryPriceId;
    const qty = it?.quantity;
    if (!id || !Number.isInteger(qty) || qty < 1) {
      throw bad("Invalid category or quantity");
    }
    merged.set(id, (merged.get(id) || 0) + qty);
  }

  // sorted by id so seats are always updated in the same order
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

// works out price and total for the selected tickets
// "db" is either prisma or a transaction (tx)
const buildOrder = async (db, sessionId, items) => {
  const { lines, totalCount } = parseItems(items);

  const session = await db.session.findUnique({ where: { id: sessionId } });
  assertFound(session, "Session not found");

  // note: the schema field is regStartdateTime (small "d"), so the start
  // check below never runs until this name is fixed
  const now = new Date();
  if (now < session.regStartDateTime || now > session.regEndDateTime) {
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

// the booking + session + venue details shown on the booking pages
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

/* ---------------------------------------------------------------
   Booking summary (before paying)
---------------------------------------------------------------- */

export const getBookingSummaryService = async ({ sessionId, items } = {}) => {
  if (!sessionId) throw bad("sessionId is required");

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

/* ---------------------------------------------------------------
   Pay for a booking
---------------------------------------------------------------- */

export const payForBookingService = async (userId, { sessionId, items } = {}) => {
  if (!sessionId) throw bad("sessionId is required");

  // everything inside the transaction is saved together, or not at all
  const result = await prisma.$transaction(async (tx) => {
    const order = await buildOrder(tx, sessionId, items);

    // take the seats (fails if someone else just bought them)
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

    // one ticket row per seat
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
  });

  // a mail failure must not fail the booking
  sendBookingEmail(result).catch((e) =>
    console.error("booking email failed:", e),
  );

  return { message: "Booking confirmed", bookingId: result.bookingId };
};

/* ---------------------------------------------------------------
   My bookings
---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------
   Cancel a booking (all tickets, or only the selected ones)
---------------------------------------------------------------- */

// counts the cancelled tickets per category and adds up the refund
const summariseCancelledTickets = (tickets) => {
  const perCategory = new Map(); // category id -> number of tickets
  const cancelledLines = new Map(); // category id -> line for the email
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
      include: { session: true },
    });
    assertFound(booking, "Booking not found");

    if (booking.status === "CANCELLED") {
      throw conflict("Booking is already cancelled");
    }

    // only CONFIRMED or PARTIALLY_CANCELLED bookings can be cancelled further
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

    // mark the tickets cancelled (fails if another request got there first)
    const claimed = await tx.tickets.updateMany({
      where: { id: { in: tickets.map((t) => t.id) }, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    });
    if (claimed.count !== tickets.length) {
      throw conflict(
        "Tickets were changed by another request. Please try again.",
      );
    }

    const { perCategory, cancelledLines, refundAmount } =
      summariseCancelledTickets(tickets);

    // give the seats back, always in the same order
    const categoryIds = [...perCategory.keys()].sort(byId);
    for (const categoryId of categoryIds) {
      await tx.sessionCategoryPrice.update({
        where: { id: categoryId },
        data: { seatsForSale: { increment: perCategory.get(categoryId) } },
      });
    }

    // always update the booking status, never leave it as CONFIRMED
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
      bookingCancelled: remaining === 0,
      cancelledLines: [...cancelledLines.values()],
      remainingCount: remaining,
      bookingStatus: newStatus,
    };
  });

  // a mail failure must not fail the cancellation
  sendCancellationEmail(bookingId, result).catch((e) =>
    console.error("cancellation email failed:", e),
  );

  return {
    message: result.bookingCancelled
      ? "Booking cancelled"
      : "Selected tickets cancelled",
    cancelledCount: result.cancelledCount,
    refundAmount: result.refundAmount,
    bookingStatus: result.bookingStatus,
    bookingCancelled: result.bookingStatus === "CANCELLED",
  };
};

/* ---------------------------------------------------------------
   Tickets of one booking
---------------------------------------------------------------- */

// groups the tickets by category: one line per category
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
      session: {
        select: {
          ...SESSION_SELECT,
          event: {
            select: { id: true, Title: true, imageUrl: true, status: true },
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

  return {
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
    ticketSummary: groupTicketsByCategory(booking.ticket),
  };
};
