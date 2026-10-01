// Ek middleware bnana pageda ki eventId uss particular user ki hee hai for organizer dashboard

import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";

const createSession = async (req, res) => {
  try {
    const { eventId } = req.params;

    const sessionsInput = Array.isArray(req.body.sessions)
      ? req.body.sessions
      : [req.body];

    if (sessionsInput.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "at least one session is required",
        success: false,
      });
    }

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
      // where: { userid: req.body.id },
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
      console.log("Organizer...........", organizer);
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "not authorized to add sessions to this event",
        success: false,
      });
    }

    const validated = [];
    for (let i = 0; i < sessionsInput.length; i++) {
      const {
        subVenueId,
        startDateTime,
        endDateTime,
        regStartdateTime,
        regEndDateTime,
      } = sessionsInput[i];

      if (
        !subVenueId ||
        !startDateTime ||
        !endDateTime ||
        !regStartdateTime ||
        !regEndDateTime
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: `session ${i}: required info not found`,
          success: false,
        });
      }

      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      const regStart = new Date(regStartdateTime);
      const regEnd = new Date(regEndDateTime);

      if (end <= start || regEnd <= regStart || regEnd > start) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: `session ${i}: invalid dates — session must end after it starts, and registration must close before the session starts`,
          success: false,
        });
      }

      validated.push({ subVenueId, start, end, regStart, regEnd });
    }

    const subVenueIds = [...new Set(validated.map((v) => v.subVenueId))];
    const count = await prisma.subVenue.count({
      where: { id: { in: subVenueIds } },
    });

    if (count !== subVenueIds.length) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "one or more subVenues not found",
        success: false,
      });
    }

    const sessions = await prisma.$transaction(
      validated.map((v) =>
        prisma.session.create({
          data: {
            eventId: Number(eventId),
            subVenueId: v.subVenueId,
            startDateTime: v.start,
            endDateTime: v.end,
            regStartdateTime: v.regStart,
            regEndDateTime: v.regEnd,
          },
        }),
      ),
    );

    res.status(StatusCodes.CREATED).json({
      sessions,
      msg: `${sessions.length} session(s) created successfully`,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create session(s)",
      success: false,
    });
  }
};
const getSessionsByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    // console.log("ID-------------------", eventId);

    const sessions = await prisma.session.findMany({
      where: { eventId: Number(eventId) },
      orderBy: { startDateTime: "asc" },
      include: { subVenue: true },
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

const getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
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
      msg: "could not fetch sessions",
      success: false,
    });
  }
};

const updateSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      subVenueId,
      startDateTime,
      endDateTime,
      regStartdateTime,
      regEndDateTime,
      registrationStatus,
    } = req.body;

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
    });
    const session = await prisma.session.findUnique({
      where: { id: Number(sessionId) },
      include: { event: true },
    });

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "session not found",
        success: false,
      });
    }

    if (!organizer || session.event.organizerId !== organizer.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "not authorized to update this session",
        success: false,
      });
    }

    const nextStart = startDateTime
      ? new Date(startDateTime)
      : session.startDateTime;
    const nextEnd = endDateTime ? new Date(endDateTime) : session.endDateTime;
    const nextRegStart = regStartdateTime
      ? new Date(regStartdateTime)
      : session.regStartdateTime;
    const nextRegEnd = regEndDateTime
      ? new Date(regEndDateTime)
      : session.regEndDateTime;

    //  if (end <= start || regEnd <= regStart || regEnd > start)
    if (
      nextEnd <= nextStart ||
      nextRegEnd <= nextRegStart ||
      nextRegEnd > nextStart
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "invalid dates: session must end after it starts, and registration must close before the session starts",
        success: false,
      });
    }

    const updated = await prisma.session.update({
      where: { id: Number(sessionId) },
      data: {
        ...(subVenueId && { subVenueId }),
        startDateTime: nextStart,
        endDateTime: nextEnd,
        regStartdateTime: nextRegStart,
        regEndDateTime: nextRegEnd,
        ...(registrationStatus && { registrationStatus }),
      },
    });

    res.status(StatusCodes.OK).json({
      session: updated,
      msg: "session updated successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not update session",
      success: false,
    });
  }
};

const deleteSessionById = async (req, res) => {};

export {
  createSession,
  getSessionsByEventId,
  getSessionById,
  updateSessionById,
};
