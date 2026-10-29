import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  assertFound,
  assertOwner,
  sendError,
} from "../../utils/serviceError.js";
import {
  validateSessions,
  getUniqueSubVenueIds,
  assertSubVenuesFound,
  buildSessionData,
  buildSessionUpdateData,
} from "../../Sevices/Organizer_Services/session.service.js";
import { findOrganizer } from "./utils/findOrganizer.js";

const createSession = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validated = validateSessions(req.body);

    const organizer = await findOrganizer(req.user.id);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    assertFound(event, "event not found");
    assertOwner(
      event,
      organizer,
      "not authorized to add sessions to this event",
    );

    const subVenueIds = getUniqueSubVenueIds(validated);
    const count = await prisma.subVenue.count({
      where: { id: { in: subVenueIds } },
    });
    assertSubVenuesFound(count, subVenueIds);

    const sessions = await prisma.$transaction(
      validated.map((v) =>
        prisma.session.create({ data: buildSessionData(eventId, v) }),
      ),
    );

    res.status(StatusCodes.CREATED).json({
      sessions,
      msg: `${sessions.length} session(s) created successfully`,
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not create session(s)");
  }
};

const getSessionsByEventId = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { startDateTime: "asc" },
      include: { subVenue: true },
    });

    res.status(StatusCodes.OK).json({ sessions, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch sessions");
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });
    assertFound(session, "session not found");

    res.status(StatusCodes.OK).json({ session, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch sessions");
  }
};

const updateSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const organizer = await findOrganizer(req.user.id);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });
    assertFound(session, "session not found");
    assertOwner(
      session.event,
      organizer,
      "not authorized to update this session",
    );

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: buildSessionUpdateData(req.body, session),
    });

    res.status(StatusCodes.OK).json({
      session: updated,
      msg: "session updated successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not update session");
  }
};

const deleteSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const organizer = await findOrganizer(req.user.id);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });
    assertFound(session, "session not found");
    assertOwner(
      session.event,
      organizer,
      "not authorized to delete this session",
    );

    await prisma.session.delete({ where: { id: sessionId } });

    res.status(StatusCodes.OK).json({
      msg: "session deleted successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not delete session");
  }
};

export {
  createSession,
  getSessionsByEventId,
  getSessionById,
  updateSessionById,
  deleteSessionById,
};
