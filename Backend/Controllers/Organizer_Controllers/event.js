import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  validateCreateEvent,
  assertFound,
  assertOwner,
  buildEventData,
  buildUpdateData,
  removeOldImage,
  handleError,
} from "../../Sevices/Organizer_Services/event.service.js";
import { findOrganizer } from "./utils/findOrganizer.js";


const createEvent = async (req, res) => {
  try {
    validateCreateEvent(req.body);

    const organizer = await findOrganizer(req.user.id);
    assertFound(organizer, "invalid organizer: organizer not found");

    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        ...buildEventData(req.body, req.file),
      },
    });

    res.status(StatusCodes.CREATED).json({
      event,
      msg: "event created successfully",
      success: true,
    });
  } catch (err) {
    const { status, body } = await handleError(
      err,
      req.file,
      "could not create event",
    );
    res.status(status).json(body);
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: { include: { subVenue: { include: { venue: true } } } },
        currentSession: true,
        organizer: true,
      },
    });
    assertFound(event, "event not found");

    res.status(StatusCodes.OK).json({ event, success: true });
  } catch (err) {
    const { status, body } = await handleError(
      err,
      null,
      "could not fetch event",
    );
    res.status(status).json(body);
  }
};

const getEventByOrganizerId = async (req, res) => {
  try {
    const organizer = await findOrganizer(req.user.id);
    assertFound(organizer, "organizer not found");

    const event = await prisma.event.findMany({
      where: { organizerId: organizer.id },
      include: { sessions: true, organizer: true },
    });

    res.status(StatusCodes.OK).json({ event, success: true });
  } catch (err) {
    const { status, body } = await handleError(
      err,
      null,
      "could not fetch event",
    );
    res.status(status).json(body);
  }
};

const updateEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await findOrganizer(req.user.id);
    const event = await prisma.event.findUnique({ where: { id } });

    assertFound(event, "event not found");
    assertOwner(event, organizer, "not authorized to update this event");

    const updated = await prisma.event.update({
      where: { id },
      data: buildUpdateData(req.body, req.file),
    });

    if (req.file) await removeOldImage(event.imageUrl);

    res.status(StatusCodes.OK).json({
      event: updated,
      msg: "event updated successfully",
      success: true,
    });
  } catch (err) {
    const { status, body } = await handleError(
      err,
      req.file,
      "could not update event",
    );
    res.status(status).json(body);
  }
};

const deleteEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await findOrganizer(req.user.id);
    const event = await prisma.event.findUnique({ where: { id } });

    assertFound(event, "event not found");
    assertOwner(event, organizer, "not authorized to delete this event");

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    await removeOldImage(event.imageUrl);

    res.status(StatusCodes.OK).json({
      msg: "Event Deleted sucecessfully",
      success: true,
    });
  } catch (err) {
    const { status, body } = await handleError(
      err,
      null,
      "Something went Wrong",
    );
    res.status(status).json(body);
  }
};

export {
  createEvent,
  getEventById,
  getEventByOrganizerId,
  updateEventById,
  deleteEventById,
};
