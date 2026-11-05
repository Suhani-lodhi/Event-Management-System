import prisma from "../../index.js"

export const markAttendanceService = async (bookingId, userId)=>{
     
    const now = new Date();

    const booking = await prisma.booking.findFirst({
        where : {
            id: bookingId,
            status: "CONFIRMED"||"PARTIALLY_CONFIRMED",
            session:{
                event: {
                    organizer: {
                        userid : userId
                    }
                }
            }
        },
        select:{
            id: true,
            status: true,
            session: {
                select: {
                    id: true,
                    startDateTime: true,
                    endDateTime: true,
                    status: true,
                    event: {
                        select: {
                            status: true
                        }
                    } 
                }
            }
        }
    })

    if(!booking){
        throw new Error("Booking not found or you are not authorized");
    }

    const session = booking.session;

    if(session.status === 'CLOSED' || session.status === 'CANCELLED'){
        throw new Error("this event is closed or cancelled");
    }

    const attendanceStart = new Date(session.startDateTime.getTime() - 3*60*60*1000);

    if(now < attendanceStart){
        throw new Error("Attendance scanning is not open yet. It opens 3 hours before the session");
    }

    if(now >= session.endDateTime){
        throw new Error("This session is expired");
    }

    const result = await prisma.tickets.updateMany({
        where: {
            bookingId,
            attended: false,
            status: 'CONFIRMED',
            cancellationId: null
        },
        data:{
            attended: true,
            attendedAt: now,
        }
    })
       
    if(result.count === 0){
        throw new Error("No eligible tickets found. Tickets may already be attended or cancelled");
    }

    return {
        bookingId,
        markedTickets: result.count,
        msg: "Attendance marked successfully"
    }
}