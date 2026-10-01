import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";

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
    const { venueId } = req.body;
    console.log("venue.......................>>>>>>", venueId);
    const subVenues = await prisma.subVenue.findMany({
      where: { venueId: venueId },
    });
    // console.log(subVenues);
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

export { getVenues, getSubVenuesByVenueId };
