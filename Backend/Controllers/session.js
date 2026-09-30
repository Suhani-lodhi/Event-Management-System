import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";

const createSession = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      subVenueId,
      startDateTime,
      endDateTime,
      regStartdateTime,
      regEndDateTime,
    } = req.body;

    if (
      !subVenueId ||
      !startDateTime ||
      !endDateTime ||
      !regStartdateTime ||
      !regEndDateTime
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "required info not found",
        success: false,
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const regStart = new Date(regStartdateTime);
    const regEnd = new Date(regEndDateTime);

    if (end <= start || regEnd <= regStart || regEnd > start) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "invalid dates: session must end after it starts, and registration must close before the session starts",
        success: false,
      });
    }

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
      //   where: { userid: req.body.id },
    });
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
    });

    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "event not found",
        success: false,
      });
    }

    if (!organizer || event.organizerId !== organizer.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: `not authorized to add sessions to this event ${organizer}`,
        success: false,
      });
    }

    const subVenue = await prisma.subVenue.findUnique({
      where: { id: subVenueId },
    });

    if (!subVenue) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "invalid subVenue: subVenue not found",
        success: false,
      });
    }
    const session = await prisma.session.create({
      data: {
        eventId: Number(eventId),
        subVenueId,
        startDateTime: start,
        endDateTime: end,
        regStartdateTime: regStart,
        regEndDateTime: regEnd,
      },
    });

    res.status(StatusCodes.CREATED).json({
      session,
      msg: "session created successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create session",
      success: false,
    });
  }
};

export { createSession };
