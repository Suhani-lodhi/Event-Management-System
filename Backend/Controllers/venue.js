import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";

const createVenue = async (req, res) => {
  try {
    const { venueName, addressLine1, city, state, country, pincode } = req.body;

    if (
      !venueName ||
      !addressLine1 ||
      !city ||
      !state ||
      !country ||
      !pincode
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Some of the values are missing",
        success: false,
      });
    }

    const venue = await prisma.venue.create({
      data: {
        venueName: venueName,
        addressLine1,
        city,
        state,
        country,
        pincode: Number(pincode),
      },
    });

    return res.status(StatusCodes.CREATED).json({
      venue,
      msg: "venue created successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create venue",
      success: false,
    });
  }
};

const updateVenue = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { venueName, addressLine1, city, state, country, pincode } = req.body;

    const venue = await prisma.venue.update({
      where: { id },
      data: {
        venueName,
        addressLine1,
        city,
        state,
        country,
        pincode: pincode ? Number(pincode) : undefined,
      },
    });

    return res.status(StatusCodes.OK).json({
      venue,
      msg: "venue updated successfully",
      success: true,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Venue not found",
        success: false,
      });
    }
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not update venue",
      success: false,
    });
  }
};
const deleteVenue = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.venue.delete({
      where: { id },
    });

    return res.status(StatusCodes.OK).json({
      msg: "session deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not delete session",
      success: false,
    });
  }
};
const getVenues = async (req, res) => {
  try {
    const venues = await prisma.venue.findMany();
    res.status(StatusCodes.OK).json({ venues, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch venues",
      success: false,
    });
  }
};

const getSubVenuesByVenueId = async (req, res) => {
  try {
    const { venueId } = req.params;
    console.log("venue.......................>>>>>>", venueId);
    const subVenues = await prisma.subVenue.findMany({
      where: { venueId: venueId },
    });
    console.log(subVenues);
    if (!subVenues) {
      res.status(StatusCodes.NOT_FOUND).json({
        msg: "Subvenue not found",
        success: false,
      });
    }
    res.status(StatusCodes.OK).json({ subVenues, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch subvenues",
      success: false,
    });
  }
};
const getSubVenuesBySubVenueId = async (req, res) => {
  try {
    const { subVenueId } = req.params;
    const subVenues = await prisma.subVenue.findMany({
      where: { id: Number(subVenueId) },
      include: { venue: true },
    });
    if (!subVenues) {
      res.status(StatusCodes.NOT_FOUND).json({
        msg: "Subvenue not found",
        success: false,
      });
    }
    res.status(StatusCodes.OK).json({ subVenues, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch subvenues",
      success: false,
    });
  }
};
const createSubVenue = async (req, res) => {
  const { venueId } = req.params;
  const { subVenueName, categoryCount, capacity } = req.body;

  if (!venueId || !subVenueName || !categoryCount || !capacity) {
    res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Some values are missing",
      success: false,
    });
  }
  
};

export {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  getSubVenuesByVenueId,
  getSubVenuesBySubVenueId,
};
