import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import fail from "../../utils/fail.js";
import { IsNotIn } from "class-validator";

const EVENT_STATUSES = ["DRAFTED", "PUBLISHED", "ACTIVE", "CANCELLED", "CLOSED"];
const REGISTRATION_STATUSES = ["OPEN", "CLOSED", "SCHEDULED"];


const ALLOWED_TRANSITIONS = {
  DRAFTED: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["CANCELLED"],
  CANCELLED: [],
  CLOSED: [],
};


const updateEventStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status, activeAt } = req.body;

    if (!eventId) {
      return fail(res, StatusCodes.BAD_REQUEST, "Invalid event id");
    }
    if (!EVENT_STATUSES.includes(status)) {
      return fail(res, StatusCodes.BAD_REQUEST, "Invalid event status");
    }
    if (status === "CLOSED") {
      return fail(
        res,
        StatusCodes.BAD_REQUEST,
        "An event is closed automatically after its last session ends and cannot be closed manually",
      );
    }

    // const organizer = await prisma.organizer.findUnique({
    //   where: { userid: req.user.id },
    // });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: { _count: { select: { sessionCategoryPrices: true } } },
        },
      },
    });

    if (!event) {
      return fail(res, StatusCodes.NOT_FOUND, "Event not found");
    }
    // if (!organizer || event.organizerId !== organizer.id) {
    //   return fail(
    //     res,
    //     StatusCodes.FORBIDDEN,
    //     "You are not authorized to update this event",
    //   );
    // }


    if (event.status === status) {
      return fail(res, StatusCodes.CONFLICT, `Event is already ${status.toLowerCase()}`);
    }

    const allowed = ALLOWED_TRANSITIONS[event.status] ?? [];
    if (!allowed.includes(status)) {
      const msg = allowed.length
        ? `A ${event.status.toLowerCase()} event can only be changed to: ${allowed
            .map((s) => s.toLowerCase())
            .join(" or ")}`
        : `A ${event.status.toLowerCase()} event can no longer be changed`;
      return fail(res, StatusCodes.CONFLICT, msg);
    }

    
    const data = { status };

    if (status === "PUBLISHED") {
      if (event.sessions.length === 0) {
        return fail(
          res,
          StatusCodes.CONFLICT,
          "Add at least one session before publishing the event",
        );
      }

      const hasPricedSession = event.sessions.some(
        (s) => s._count.sessionCategoryPrices > 0,
      );
      if (!hasPricedSession) {
        return fail(
          res,
          StatusCodes.CONFLICT,
          "Add pricing to at least one session before publishing the event",
        );
      }

      if (!activeAt) {
        return fail(
          res,
          StatusCodes.BAD_REQUEST,
          "Please provide the date on which the event becomes active",
        );
      }

      const activeDate = new Date(activeAt);
      if (Number.isNaN(activeDate.getTime())) {
        return fail(res, StatusCodes.BAD_REQUEST, "Active date is not a valid date");
      }
      if (activeDate <= new Date()) {
        return fail(
          res,
          StatusCodes.BAD_REQUEST,
          "Active date must be in the future",
        );
      }

      data.activeAt = activeDate;
    }

    const closesRegistration = status === "CANCELLED";
    

    const [updated] = await prisma.$transaction([
      prisma.event.update({
        where: { id: eventId },
        data,
        select: { id: true, status: true, activeAt: true },
      }),

      ...(data.status === "PUBLISHED"?[prisma.session.updateMany({
        where: {eventId},
        data: {
          status: "PUBLISHED",
        }
      })]: data.status === "CANCELLED" ? [prisma.session.updateMany({
        where: {eventId, status : IsNotIn("CLOSED")},
        data: {
          status : "CANCELLED",
          registrationStatus: "CLOSED"
        }
      })]: []),
      // ...(closesRegistration
      //   ? [
      //       prisma.session.updateMany({
      //         where: { eventId },
      //         data: { registrationStatus: "CLOSED" },
      //       }),
      //     ]
      //   : []),
    ]);

    return res.status(StatusCodes.OK).json({
      event: updated,
      msg: `Event ${status.toLowerCase()} successfully`,
      success: true,
    });
  } catch (err) {
    console.error(err);
    return fail(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Could not update event status. Please try again",
    );
  }
};


const updateRegistrationStatus = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { registrationStatus } = req.body;

    if (!sessionId) {
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