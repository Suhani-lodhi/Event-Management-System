import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  assertFound,
  assertOwner,
  sendError,
} from "../../utils/serviceError.js";
import {
  validateEventStatus,
  validateRegistrationStatus,
  assertCanPublish,
  assertCanOpenRegistration,
  shouldCloseSessions,
} from "../../Sevices/Organizer_Services/eventStatus.service.js";
import { findOrganizer } from "../../utils/findOrganizer.js";

const updateEventStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body;
    validateEventStatus(eventId, status);

    const organizer = await findOrganizer(req.user.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        sessions: {
          include: { _count: { select: { sessionCategoryPrices: true } } },
        },
      },
    });

    assertFound(event, "event not found");
    assertOwner(event, organizer, "not authorized to update this event");
    assertCanPublish(event, status);

    const [updated] = await prisma.$transaction([
      prisma.event.update({
        where: { id: eventId },
        data: { status },
        select: { id: true, status: true },
      }),
      ...(shouldCloseSessions(status)
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
    sendError(res, err, "could not update event status");
  }
};

const updateRegistrationStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { registrationStatus } = req.body;
    validateRegistrationStatus(sessionId, registrationStatus);

    const organizer = await findOrganizer(req.user.id);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: true,
        _count: { select: { sessionCategoryPrices: true } },
      },
    });

    assertFound(session, "session not found");
    assertOwner(
      session.event,
      organizer,
      "not authorized to update this session",
    );
    assertCanOpenRegistration(session, registrationStatus);

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
    sendError(res, err, "could not update registration status");
  }
};

export { updateEventStatus, updateRegistrationStatus };
