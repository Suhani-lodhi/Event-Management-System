import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import { ServiceError, assertFound } from "../../utils/serviceError.js";
import { VISIBLE_STATUSES } from "./event.service.js";

export const getSessionByIdService = async (sessionId) => {
  if (!sessionId) {
    throw new ServiceError("invalid session id", StatusCodes.BAD_REQUEST);
  }

  const session = await prisma.session.findFirst({
    where: { id: sessionId, event: { status: { in: VISIBLE_STATUSES } } },
    include: {
      subVenue: {
        select: {
          subVenueName: true,
          venue: {
            select: {
              venueName: true,
              addressLine1: true,
              city: true,
              state: true,
            },
          },
        },
      },
      event: {
        select: {
          id: true,
          Title: true,
          Description: true,
          imageUrl: true,
          category: true,
          genre: true,
          status: true,
          organizer: { select: { displayName: true, companyName: true } },
          // the event's other dates
          sessions: {
            where: { id: { not: sessionId } },
            orderBy: { startDateTime: "asc" },
            select: {
              id: true,
              startDateTime: true,
              endDateTime: true,
              regStartdateTime: true,
              regEndDateTime: true,
              subVenue: {
                select: {
                  subVenueName: true,
                  venue: { select: { venueName: true, city: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  assertFound(session, "session not found");

  return session;
};

// All upcoming sessions, one per card, for the participant listing page
export const getSessionsService = () =>
  prisma.session.findMany({
    where: {
      endDateTime: { gte: new Date() },
      event: { status: { in: VISIBLE_STATUSES } },
    },
    orderBy: { startDateTime: "asc" },
    include: {
      event: {
        select: {
          id: true,
          Title: true,
          Description: true,
          imageUrl: true,
          category: true,
          genre: true,
          status: true,
        },
      },
      subVenue: {
        select: {
          subVenueName: true,
          venue: { select: { venueName: true, city: true } },
        },
      },
    },
  });
