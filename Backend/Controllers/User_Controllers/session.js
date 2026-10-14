import prisma from "../../index.js";
import { StatusCodes } from "http-status-codes";

const VISIBLE_STATUSES = ["COMING_SOON", "ACTIVE", "CLOSED", "DRAFTED"];

const getSessionById = async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "invalid session id",
        success: false,
      });
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

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "session not found",
        success: false,
      });
    }

    res.status(StatusCodes.OK).json({ session, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch session",
      success: false,
    });
  }
};

// All upcoming sessions, one per card, for the participant listing page
const getSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
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

    res.status(StatusCodes.OK).json({ sessions, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch sessions",
      success: false,
    });
  }
};

export { getSessionById, getSessions };
