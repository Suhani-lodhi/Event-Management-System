import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import { assertFound, sendError } from "../../utils/serviceError.js";
import {
  validateCreateVenue,
  buildVenueData,
  buildVenueUpdateData,
  assertNoSessions,
  validateCreateSubVenue,
  buildSubVenueData,
  buildSubVenueUpdateData,
} from "../../Sevices/Organizer_Services/venue.service.js";

const createVenue = async (req, res) => {
  try {
    validateCreateVenue(req.body);

    const venue = await prisma.venue.create({
      data: buildVenueData(req.body, req.user.id),
      include: { subVenues: { include: { seatCategories: true } } },
    });

    res.status(StatusCodes.CREATED).json({
      venue,
      msg: "venue created successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not create venue");
  }
};

const createSubVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    validateCreateSubVenue(req.body);

    const [subVenue] = await prisma.$transaction([
      prisma.subVenue.create({ data: buildSubVenueData(req.body, venueId) }),
      prisma.venue.update({
        where: { id: venueId },
        data: { subVenueCount: { increment: 1 } },
      }),
    ]);

    res.status(StatusCodes.CREATED).json({
      subVenue,
      msg: "subvenue created successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not create subvenue");
  }
};

const getVenueById = async (req, res) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.params.id },
      include: { subVenues: true },
    });
    assertFound(venue, "Venue not found");

    res.status(StatusCodes.OK).json({ venue, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch venue");
  }
};

const updateVenue = async (req, res) => {
  try {
    const venue = await prisma.venue.update({
      where: { id: req.params.id },
      data: buildVenueUpdateData(req.body),
    });

    res.status(StatusCodes.OK).json({
      venue,
      msg: "venue updated successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not update venue");
  }
};

const deleteVenue = async (req, res) => {
  try {
    const venueId = req.params.id;

    const venue = await prisma.venue.findFirst({
      where: { id: venueId, userId: req.user.id },
    });
    assertFound(venue, "venue not found");

    const sessionCount = await prisma.session.count({
      where: { subVenue: { venueId } },
    });
    assertNoSessions(sessionCount);

    await prisma.$transaction([
      prisma.seatCategory.deleteMany({ where: { subVenue: { venueId } } }),
      prisma.subVenue.deleteMany({ where: { venueId } }),
      prisma.venue.delete({ where: { id: venueId } }),
    ]);

    res.status(StatusCodes.OK).json({
      msg: "venue deleted successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not delete venue");
  }
};

const getVenues = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany();
    res.status(StatusCodes.OK).json({ venues, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch venues");
  }
};

const getVenuesByOrganizerId = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      where: { userId: req.user.id },
      include: { subVenues: true },
      orderBy: { id: "desc" },
    });
    res.status(StatusCodes.OK).json({ venues, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch venues");
  }
};

const getSubVenuesByVenueId = async (req, res) => {
  try {
    const subVenues = await prisma.subVenue.findMany({
      where: { venueId: req.params.venueId },
    });
    res.status(StatusCodes.OK).json({ subVenues, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch subvenues");
  }
};

const getSubVenuesBySubVenueId = async (req, res) => {
  try {
    const subVenues = await prisma.subVenue.findMany({
      where: { id: req.params.subVenueId },
      include: { venue: true },
    });
    res.status(StatusCodes.OK).json({ subVenues, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch subvenues");
  }
};

const updateSubVenue = async (req, res) => {
  try {
    const subVenue = await prisma.subVenue.update({
      where: { id: req.params.id },
      data: buildSubVenueUpdateData(req.body),
    });

    res.status(StatusCodes.OK).json({
      subVenue,
      msg: "subvenue updated successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not update subvenue");
  }
};

const deleteSubVenue = async (req, res) => {
  try {
    await prisma.subVenue.delete({ where: { id: req.params.id } });

    res.status(StatusCodes.OK).json({
      msg: "subvenue deleted successfully",
      success: true,
    });
  } catch (err) {
    sendError(res, err, "could not delete subvenue");
  }
};

export {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  createSubVenue,
  getSubVenuesByVenueId,
  getSubVenuesBySubVenueId,
  getVenuesByOrganizerId,
  updateSubVenue,
  deleteSubVenue,
};
