import prisma from '../../index.js'
import { assertFound } from "../../utils/serviceError.js";


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

export const getBookingDetailService = async (userId, bookingId) => {
  if (!userId) {
    throw new ServiceError("Not authenticated", StatusCodes.UNAUTHORIZED);
  }
  if (!bookingId) throw bad("Invalid booking id");

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId}, 
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
      bookedOn: booking.createdAt
      
    },
    event: booking.session.event,
    session: {
      id: booking.session.id,
      startDateTime: booking.session.startDateTime,
      endDateTime: booking.session.endDateTime,
      canCancel : booking.session.startDateTime - Date.now() > 3*60*60*100,
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