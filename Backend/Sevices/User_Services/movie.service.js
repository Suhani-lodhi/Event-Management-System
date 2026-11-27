import prisma from "../../index.js";
import { assertFound, sendError, ServiceError } from "../../utils/serviceError.js";
import { bad, conflict } from "./booking.service.js";


const HOLD_MINUTES = process.env.HOLD_TIME;
const MAX_SEATS = process.env.MAX_SELECTABLE_SEATS;

const invalid = (message) => Object.assign(new Error(message), { status: 400 });   

const payForMovieSeatService = async ({ selectedSeats, sessionId, userId }) => {
  assertFound(userId, "userId not found");
  assertFound(sessionId, "sessionId not found");

  const ids = [...new Set(Array.isArray(selectedSeats) ? selectedSeats : [])].sort();
  if (ids.length < 1 || ids.length > MAX_SEATS) {
    throw invalid(`Select between 1 and ${MAX_SEATS} seats`);
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);


    const session = await tx.session.findUnique({
      where: { id: sessionId },
      select: { registrationStatus: true, regStartdateTime: true, regEndDateTime: true, startDateTime: true },
    });
    assertFound(session, "Session not found");

    if (
      session.registrationStatus !== "OPEN" ||
      now < session.regStartdateTime ||
      now > session.regEndDateTime ||
      now >= session.startDateTime
    ) {
      throw conflict("Booking is closed for this showtime");
    }


    const seats = await tx.sessionSeat.findMany({
      where: { id: { in: ids }, sessionId, seatDetail: { isActive: true } },
      select: { id: true },
    });
    if (seats.length !== ids.length) {
      throw conflict("Selected seats don't belong to this showtime");
    }


    const claimed = await tx.sessionSeat.updateMany({
      where: {
        id: { in: ids },
        sessionId,
        OR: [
          { status: "AVAILABLE" },
          { status: "LOCKED", lockedUntil: { lt: now } },
        ],
      },
      data: { status: "LOCKED", lockedUntil },
    });


    if (claimed.count !== ids.length) {
      throw conflict("Some seats were just taken. Please choose again.");
    }

    return { seatIds: ids, lockedUntil };
  });
};


const confirmBooking = async ({selectedSeats, sessionId, userId}) =>{
      assertFound(userId, "userId not found");
  assertFound(sessionId, "sessionId not found");

   const ids = [...new Set(Array.isArray(selectedSeats) ? selectedSeats : [])].sort();
  if (ids.length < 1 || ids.length > MAX_SEATS) {
    throw invalid(`Select between 1 and ${MAX_SEATS} seats`);
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();



    const session = await tx.session.findUnique({
      where: { id: sessionId },
      select: { registrationStatus: true, regStartdateTime: true, regEndDateTime: true, startDateTime: true },
    });
    assertFound(session, "Session not found");

    if (
      session.registrationStatus !== "OPEN" ||
      now < session.regStartdateTime ||
      now > session.regEndDateTime ||
      now >= session.startDateTime
    ) {
      throw conflict("Booking is closed for this showtime");
    }


    const seats = await tx.sessionSeat.findMany({
      where: { id: { in: ids }, sessionId, seatDetail: { isActive: true } },
      select: { 
        id: true, 
        lockedUntil: true,
        sessionCategoryPrice: {
            select: {
                id: true,
                price: true
            }
        } 
    },
    });
    if (seats.length !== ids.length) {
      throw conflict("Selected seats don't belong to this showtime");
    }

    const totalPaise = seats.reduce(
  (sum, seat) => sum + Math.round(Number(seat.sessionCategoryPrice.price) * 100),
  0
);
const totalAmount = totalPaise / 100;     
    const ticketData = [];
    seats.map((s) =>{
        if(s.lockedUntil < now){
            throw conflict("Time expired for this booking");
        }
        ticketData.push({
          sessionCategoryPriceId: s.sessionCategoryPrice.id,
          unitPrice: s.sessionCategoryPrice.price,
          status: 'CONFIRMED',
          sessionSeatId: s.id
        })
    })


    const booking = await tx.booking.create({
        data: {
          sessionId,
        userId,
        totalCount: ids.length,
        totalAmount,
        status: 'CONFIRMED',
        ticket: { create: ticketData },

        },
        select: { id: true,},

    })

    // seats.map(async (s) => {
        
    //        const tickets = await prisma.tickets.create({
    //         data: {
    //               bookingId: booking.id,
    //               sessionCategoryPriceId: s.sessionCategoryPrice.id,
    //               unitPrice: s.sessionCategoryPrice.price,
    //               status: 'CONFIRMED',
    //               sessionSeatId: s.id
    //         }
    //        })
    // })


    const claimed = await tx.sessionSeat.updateMany({
      where: {
        id: { in: ids },
        sessionId,
        status: "LOCKED", 
        lockedUntil: { gt : now } 
    
      },
      data: { status: "BOOKED", bookingId: booking.id, lockedUntil: null },
    });


    if (claimed.count !== ids.length) {
      throw conflict("Some seats were just taken. Please choose again.");
    }

    return { bookingId: booking.id };
  });

}


export {
    payForMovieSeatService,
    confirmBooking
}