import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";
import fail from "../utils/fail.js";

const EVENT_STATUSES = ["DRAFTED", "COMING_SOON", "ACTIVE", "CLOSED"];
const REGISTRATION_STATUSES = ["OPEN", "CLOSED"];


const updateEventStatus = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(eventId)) {
      return fail(res, StatusCodes.BAD_REQUEST, "invalid event id");
    }
    if (!EVENT_STATUSES.includes(status)) {
      return fail(res, StatusCodes.BAD_REQUEST, "invalid event status");
    }

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
    });
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: { _count: { select: { sessionCategoryPrices: true } } },
        },
      },
    });

    if (!event) return fail(res, StatusCodes.NOT_FOUND, "event not found");
    if (!organizer || event.organizerId !== organizer.id) {
      return fail(res, StatusCodes.FORBIDDEN, "not authorized to update this event");
    }

    const goingLive = status === "COMING_SOON" || status === "ACTIVE";
    if (goingLive) {
      const hasPricedSession = event.sessions.some(
        (s) => s._count.sessionCategoryPrices > 0,
      );
      if (!hasPricedSession) {
        return fail(
          res,
          StatusCodes.CONFLICT,
          "add at least one session with pricing before publishing the event",
        );
      }
    }

    const closesRegistration = status === "DRAFTED" || status === "CLOSED";

    const [updated] = await prisma.$transaction([
      prisma.event.update({
        where: { id: eventId },
        data: { status },
        select: { id: true, status: true },
      }),
      ...(closesRegistration
        ? [
            prisma.session.updateMany({
              where: { eventId },
              data: { registrationStatus: "CLOSED" },
            }),
          ]
        : []),
    ]);

    res.status(StatusCodes.OK).json({
      event: updated,
      msg: "event status updated successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not update event status");
  }
};


const updateRegistrationStatus = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const { registrationStatus } = req.body;

    if (!Number.isInteger(sessionId)) {
      return fail(res, StatusCodes.BAD_REQUEST, "invalid session id");
    }
    if (!REGISTRATION_STATUSES.includes(registrationStatus)) {
      return fail(res, StatusCodes.BAD_REQUEST, "invalid registration status");
    }

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
    });
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: true,
        _count: { select: { sessionCategoryPrices: true } },
      },
    });

    if (!session) return fail(res, StatusCodes.NOT_FOUND, "session not found");
    if (!organizer || session.event.organizerId !== organizer.id) {
      return fail(res, StatusCodes.FORBIDDEN, "not authorized to update this session");
    }

    if (registrationStatus === "OPEN") {
      const eventStatus = session.event.status ?? "DRAFTED";
      if (eventStatus === "DRAFTED" || eventStatus === "CLOSED") {
        return fail(
          res,
          StatusCodes.CONFLICT,
          "publish the event before opening registration",
        );
      }
      if (session._count.sessionCategoryPrices === 0) {
        return fail(
          res,
          StatusCodes.CONFLICT,
          "set pricing for this session before opening registration",
        );
      }
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { registrationStatus },
      select: { id: true, registrationStatus: true },
    });

    res.status(StatusCodes.OK).json({
      session: updated,
      msg: "registration status updated successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not update registration status");
  }
};

export { updateEventStatus, updateRegistrationStatus };