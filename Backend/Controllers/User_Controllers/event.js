import prisma from "../../index.js";
import { StatusCodes } from "http-status-codes";

const getEventById = async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "invalid event id",
        success: false,
      });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        status: { in: ["COMING_SOON", "ACTIVE", "CLOSED", "DRAFTED"] },
      },
      include: {
        sessions: {
          orderBy: { startDateTime: "asc" },
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
          },
        },
        organizer: { select: { displayName: true, companyName: true } },
      },
    });

    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "event not found",
        success: false,
      });
    }

    res.status(StatusCodes.OK).json({ event, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch event",
      success: false,
    });
  }
};


const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { id: "desc" },
    });

    res.status(StatusCodes.OK).json({ events, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch events",
      success: false,
    });
  }
};



export { getEventById, getEvents };
