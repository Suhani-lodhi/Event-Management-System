import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";

const createVenue = async (req, res) => {
  try {
    const { venueName, addressLine1, city, state, country, pincode, subVenues } = req.body;

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

    if (!Array.isArray(subVenues) || subVenues.length === 0) {
  return res.status(StatusCodes.BAD_REQUEST).json({
    msg: "At least one sub-venue is required",
    success: false,
  });
}

const subVenueData = subVenues.map((sv) => ({
  subVenueName: sv.subVenueName || null,
  categoryCount: Number(sv.categoryCount),
  capacity: sv.capacity == null || sv.capacity === "" ? null : Number(sv.capacity),
}));

    const venue = await prisma.venue.create({
      data: {
        venueName: venueName,
        addressLine1,
        city,
        state,
        country,
        pincode: Number(pincode),
        subVenueCount: subVenues.length,
    subVenues: {
      create: subVenueData,
    },
      },
      include: { subVenues: true },
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

    const subVenues = await prisma.subVenue.findMany({
      where: { venueId: Number(venueId) },
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
  const subVenues = [...req.body];
  
   if (subVenues.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "at least one subvenue is required",
        success: false,
      });
    }
     
  const subVenueData = subVenues.map((sv)=>{
    return {
      ...sv,
      venueId : venueId
    }
  })
   

  console.log(subVenueData);

  for(let i=0; i<subVenueData.length; i++){

    if (!subVenueData.venueId || !subVenueData.subVenueName || !subVenueData.categoryCount || !subVenueData.capacity) {
    res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Some values are missing",
      success: false,
    });
  }

  }

  try{
    const result = await prisma.SubVenue.createMany({subVenueData, skipDuplicates: true,})
    res.status(StatusCodes.OK).json({ result, success: true });
    
  }
 catch(err){
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not add subvenues",
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
