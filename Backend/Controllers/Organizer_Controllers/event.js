import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import fs from "fs/promises";
import path from "path";
import { removeUploadedFile, removeFile } from "../../utils/imagehandle.js";

const createEvent = async (req, res) => {
  try {
    const { category, genre, Title, Description } = req.body;

    if (!category || !genre || !Title) {
      await removeUploadedFile(req.file);
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "required info not found",
        success: false,
      });
    }
    console.log(req.user.id);
    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
      // where: { userid: id },
    });

    if (!organizer) {
      await removeUploadedFile(req.file);
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "invalid organizer: organizer not found",
        success: false,
      });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        category,
        genre,
        Title,
        Description: Description || null,
        imageUrl: imageUrl,
      },
    });

    res.status(StatusCodes.CREATED).json({
      event,
      msg: "event created successfully",
      success: true,
    });
  } catch (err) {
    await removeUploadedFile(req.file);
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create event",
      success: false,
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: {
        sessions: { include: { subVenue: { include: { venue: true } } } },
        currentSession: true,
        organizer: true,
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

const getEventByOrganizerId = async (req, res) => {
  try {
    //const { id } = req.body;
    const { id } = req.user;
    // console.log(">>>>>>>>>uhjghvghcvfg>>>>>>>>>>>", req.user.id, id);

    const organizer = await prisma.organizer.findUnique({
      where: { userid: Number(id) },
    });
    const event = await prisma.event.findMany({
      where: { organizerId: Number(organizer.id) },
      include: { sessions: true, organizer: true },
    });
    // console.log(">>>>>>>event>>>>>", event);

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

const updateEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = Number(id);

    const { category, genre, Title, Description } = req.body;
    // const { userId } = req.body;

    const organizer = await prisma.organizer.findUnique({
      // where: { userid: userId },
      where: { userid: req.user.id },
    });
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      await removeFile(req.file);
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "event not found",
        success: false,
      });
    }

    if (!organizer || event.organizerId !== organizer.id) {
      await removeFile(req.file?.path);
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "not authorized to update this event",
        success: false,
      });
    }

    const updated = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        ...(category && { category }),
        ...(genre && { genre }),
        ...(Title && { Title }),
        ...(Description !== undefined && { Description }),
        ...(req.file && { imageUrl: `/uploads/${req.file.filename}` }),
      },
    });

    if (req.file && event.imageUrl) {
      await removeFile(path.join("uploads", path.basename(event.imageUrl)));
    }

    res.status(StatusCodes.OK).json({
      event: updated,
      msg: "event updated successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not update event",
      success: false,
    });
  }
};

const deleteEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = Number(id);
    const userId = req.user.id;
    // const { userId } = req.body;

    const organizer = await prisma.organizer.findUnique({
      where: { userid: userId },
    });

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "event not found",
        success: false,
      });
    }

    if (!organizer || event.organizerId !== organizer.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        msg: "not authorized to delete this event",
        success: false,
      });
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { eventId: eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);

    if (event.imageUrl) {
      await removeFile(path.join("uploads", path.basename(event.imageUrl)));
    }

    res.status(StatusCodes.OK).json({
      msg: "Event Deleted sucecessfully",
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Something went Wrong",
      success: false,
    });
  }
};

export {
  createEvent,
  getEventById,
  getEventByOrganizerId,
  updateEventById,
  deleteEventById,
};
