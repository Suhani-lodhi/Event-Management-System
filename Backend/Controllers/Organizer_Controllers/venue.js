import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import fail from "../../utils/fail.js";

const createVenue = async (req, res) => {
  try {
    const {
      venueName,
      addressLine1,
      city,
      state,
      country,
      pincode,
      subVenues,
    } = req.body;

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

    // validate categories of every sub-venue
    for (const sv of subVenues) {
      if (!sv) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: "Invalid sub-venue",
          success: false,
        });
      }

      const categories = sv.categories ?? [];
      if (!Array.isArray(categories)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: "categories must be a list",
          success: false,
        });
      }

      const names = new Set();
      for (const c of categories) {
        const name = String(c?.categoryName ?? "").trim();
        const count = Number(c?.seatCount);

        if (!name) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            msg: "Every category needs a name",
            success: false,
          });
        }
        if (!Number.isInteger(count) || count < 1) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            msg: `seatCount for "${name}" must be a whole number, 1 or more`,
            success: false,
          });
        }
        if (names.has(name.toLowerCase())) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            msg: `duplicate category name "${name}" in a sub-venue`,
            success: false,
          });
        }
        names.add(name.toLowerCase());
      }
    }

    // categoryCount and capacity are calculated here, not trusted from the client
    const subVenueData = subVenues.map((sv) => {
      const categories = sv.categories ?? [];
      return {
        subVenueName: sv.subVenueName || null,
        categoryCount: categories.length,
        capacity: categories.length
          ? categories.reduce((total, c) => total + Number(c.seatCount), 0)
          : null,
        seatCategories: {
          create: categories.map((c) => ({
            categoryName: String(c.categoryName).trim(),
            categoryDetail: String(c.categoryDetail ?? "").trim() || null,
            seatCount: Number(c.seatCount),
          })),
        },
      };
    });

    const venue = await prisma.venue.create({
      data: {
        venueName,
        addressLine1,
        city,
        state,
        country,
        pincode: Number(pincode),
        subVenueCount: subVenues.length,
        userId: req.user.id,
        subVenues: {
          create: subVenueData,
        },
      },
      include: { subVenues: { include: { seatCategories: true } } },
    });

    return res.status(StatusCodes.CREATED).json({
      venue,
      msg: "venue created successfully",
      success: true,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({
        msg: "this category name already exists in the subvenue",
        success: false,
      });
    }
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create venue",
      success: false,
    });
  }
};
const createSubVenue = async (req, res) => {
  try {
    const venueId = Number(req.params.id);
    const { subVenueName, categoryCount, capacity } = req.body;

    if (Number.isNaN(venueId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid venue id",
        success: false,
      });
    }

    if (
      !subVenueName ||
      categoryCount === undefined ||
      capacity === undefined
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Some values are missing",
        success: false,
      });
    }

    if (Number.isNaN(Number(categoryCount)) || Number.isNaN(Number(capacity))) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "categoryCount and capacity must be numbers",
        success: false,
      });
    }

    const [subVenue] = await prisma.$transaction([
      prisma.subVenue.create({ data: { ...req.body, venueId } }),
      prisma.venue.update({
        where: { id: venueId },
        data: { subVenueCount: { increment: 1 } },
      }),
    ]);

    return res.status(StatusCodes.CREATED).json({
      subVenue,
      msg: "subvenue created successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not create subvenue",
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
    const venueId = Number(req.params.id);
    if (!Number.isInteger(venueId)) {
      return fail(res, StatusCodes.BAD_REQUEST, "invalid venue id");
    }

    const venue = await prisma.venue.findFirst({
      where: { id: venueId, userId: req.user.id },
    });
    if (!venue) return fail(res, StatusCodes.NOT_FOUND, "venue not found");

    const sessionCount = await prisma.session.count({
      where: { subVenue: { venueId } },
    });
    if (sessionCount > 0) {
      return fail(
        res,
        StatusCodes.CONFLICT,
        `${sessionCount} session(s) use this venue, delete or move them first`,
      );
    }

    await prisma.$transaction([
      prisma.seatCategory.deleteMany({ where: { subVenue: { venueId } } }),
      prisma.subVenue.deleteMany({ where: { venueId } }),
      prisma.venue.delete({ where: { id: venueId } }),
    ]);

    return res.status(StatusCodes.OK).json({
      msg: "venue deleted successfully",
      success: true,
    });
  } catch (err) {
    if (err.code === "P2003") {
      return fail(res, StatusCodes.CONFLICT, "this venue is still in use");
    }
    console.error(err);
    return fail(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "could not delete venue",
    );
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

const getVenuesByOrganizerId = async (req, res) => {
  try {
    console.log(req.user.id);
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
  createSubVenue,
  getSubVenuesByVenueId,
  getSubVenuesBySubVenueId,
  getVenuesByOrganizerId,
  updateSubVenue,
  deleteSubVenue,
};
