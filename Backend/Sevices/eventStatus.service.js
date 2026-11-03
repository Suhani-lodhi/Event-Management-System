import prisma from "../index.js";

export const updateEventAndSessionStatuses = async () => {
  const now = new Date();


  try {
    const result = await prisma.$transaction([

      prisma.event.updateMany({
        where: {
          status: "PUBLISHED",
          activeAt: {
            lte: now,
          },
        },
        data: {
          status: "ACTIVE",
        },
      }),



    
      prisma.session.updateMany({
        where: {
          status: {
            in: ["PUBLISHED", "ACTIVE"],
          },
          endDateTime: {
            lte: now,
          },
        },
        data: {
          status: "CLOSED",
          registrationStatus: "CLOSED",
        },
      }),


      prisma.session.updateMany({
        where: {
          status: "PUBLISHED",
          startDateTime: {
            lte: now,
          },
          endDateTime: {
            gt: now,
          },
        },
        data: {
          status: "ACTIVE",
        },
      }),

      prisma.session.updateMany({
        where: {
          status: {
            in: ["PUBLISHED", "ACTIVE"],
          },
          registrationStatus: "SCHEDULED",
          regStartdateTime: {
            lte: now,
          },
          regEndDateTime: {
            gt: now,
          },
          endDateTime: {
            gt: now,
          },
        },
        data: {
          registrationStatus: "OPEN",
        },
      }),



      prisma.session.updateMany({
        where: {
          registrationStatus: {
            not: "CLOSED",
          },
          regEndDateTime: {
            lte: now,
          },
        },
        data: {
          registrationStatus: "CLOSED",
        },
      }),


      prisma.event.updateMany({
        where: {
          status: {
            in: ["PUBLISHED", "ACTIVE"],
          },
          sessions: {
            some: {},
            every: {
              status: "CLOSED",
            },
          },
        },
        data: {
          status: "CLOSED",
        },
      }),
    ]);


    console.log("Event and session statuses updated:", {
      activatedEvents: result[0].count,
      closedSessions: result[1].count,
      activatedSessions: result[2].count,
      openedRegistrations: result[3].count,
      closedRegistrations: result[4].count,
      closedEvents: result[5].count,
    });


    return result;
  } catch (error) {
    console.error("Error updating event statuses:", error);
    throw error;
  }
};