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
        userId:req.user.id,
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

const getVenueById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: { subVenues: true },
    });

    if (!venue) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Venue not found",
        success: false,
      });
    }

    return res.status(StatusCodes.OK).json({ venue, success: true });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch venue",
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

    await prisma.$transaction([
      prisma.subVenue.deleteMany({ where: { venueId: id } }),
      prisma.venue.delete({ where: { id } }),
    ]);

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

const getVenuesByOrganizerId = async (req, res)=>{
  try {
    console.log(req.user.id)
    const venues = await prisma.Venue.findMany({
      where: { userId: req.user.id },
      include: { subVenues: true },
      orderBy: { id: "desc" },
    });

    return res.status(StatusCodes.OK).json({ venues, success: true });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch venues",
      success: false,
    });
  }
}

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
const updateSubVenue = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid subvenue id",
        success: false,
      });
    }

    const { subVenueName, categoryCount, capacity } = req.body;

    const subVenue = await prisma.subVenue.update({
      where: { id },
      data: {
        subVenueName,
        categoryCount:
          categoryCount !== undefined ? Number(categoryCount) : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
      },
    });

    return res.status(StatusCodes.OK).json({
      subVenue,
      msg: "subvenue updated successfully",
      success: true,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not update subvenue",
      success: false,
    });
  }
};
const deleteSubVenue = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid subvenue id",
        success: false,
      });
    }

    await prisma.subVenue.delete({
      where: { id },
    });

    return res.status(StatusCodes.OK).json({
      msg: "subvenue deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not delete subvenue",
      success: false,
    });
  }
};

export {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getSubVenuesByVenueId,
  getSubVenuesBySubVenueId,
  getVenuesByOrganizerId,
  updateSubVenue,
  deleteSubVenue,
};
