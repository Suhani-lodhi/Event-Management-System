import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  validateCategory,
  validateCategoryForUpdate,
} from "../../Sevices/seatCategory.service.js";
import fail from "../../utils/fail.js";

const updateSubVenueTotals = async (tx, subVenueId) => {
  const { _count, _sum } = await tx.seatCategory.aggregate({
    where: { subVenueId },
    _count: { _all: true },
    _sum: { seatCount: true },
  });
  return tx.subVenue.update({
    where: { id: subVenueId },
    data: { categoryCount: _count._all, capacity: _sum.seatCount ?? 0 },
  });
};

const loadOwnCategory = async (req, res) => {
  const category = await prisma.seatCategory.findUnique({
    where: { id: req.params.categoryId },
    include: { subVenue: { include: { venue: true } } },
  });
  if (!category) {
    fail(res, StatusCodes.NOT_FOUND, "category not found");
    return null;
  }
  if (category.subVenue.venue.userId !== req.user.id) {
    fail(res, StatusCodes.FORBIDDEN, "not allowed");
    return null;
  }
  return category;
};

const createSeatCategory = async (req, res) => {
  try {
    const subVenueId = req.params.subVenueId;
    const error = validateCategory(req.body);
    if (error) return fail(res, StatusCodes.BAD_REQUEST, error);

    const subVenue = await prisma.subVenue.findUnique({
      where: { id: subVenueId },
      include: { venue: true },
    });
    if (!subVenue)
      return fail(res, StatusCodes.NOT_FOUND, "subvenue not found");
    if (subVenue.venue.userId !== req.user.id) {
      return fail(res, StatusCodes.FORBIDDEN, "not allowed");
    }

    const { categoryName, categoryDetail, seatCount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.seatCategory.create({
        data: {
          subVenueId,
          categoryName: categoryName.trim(),
          categoryDetail,
          seatCount: seatCount,
        },
      });
      const updatedSubVenue = await updateSubVenueTotals(tx, subVenueId);
      return { category, subVenue: updatedSubVenue };
    });

    res.status(StatusCodes.CREATED).json({
      ...result,
      msg: "category created successfully",
      success: true,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return fail(
        res,
        StatusCodes.CONFLICT,
        "this category name already exists in the subvenue",
      );
    }
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not create category");
  }
};

const getCategoriesBySubVenueId = async (req, res) => {
  try {
    const categories = await prisma.seatCategory.findMany({
      where: { subVenueId: req.params.subVenueId },
      orderBy: { id: "asc" },
    });
    res.status(StatusCodes.OK).json({ categories, success: true });
  } catch (err) {
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not fetch categories");
  }
};

const updateSeatCategory = async (req, res) => {
  try {
    const error = validateCategoryForUpdate(req.body);
    if (error) return fail(res, StatusCodes.BAD_REQUEST, error);

    const category = await loadOwnCategory(req, res);
    if (!category) return;

    const { categoryName, categoryDetail, seatCount } = req.body;

    // build data from only the fields that were sent
    const data = {};
    if (categoryName !== undefined) data.categoryName = categoryName.trim();
    if (categoryDetail !== undefined) data.categoryDetail = categoryDetail;
    if (seatCount !== undefined) data.seatCount = seatCount;

    if (Object.keys(data).length === 0) {
      return fail(res, StatusCodes.BAD_REQUEST, "nothing to update");
    }

    // can't go below the seats a session is already selling from this category
    if (data.seatCount !== undefined) {
      const onSale = await prisma.sessionCategoryPrice.findFirst({
        where: {
          seatCategoryId: category.id,
          seatsForSale: { gt: data.seatCount },
        },
      });
      if (onSale) {
        return fail(
          res,
          StatusCodes.CONFLICT,
          `a session is selling ${onSale.seatsForSale} seats from this category, reduce that first`,
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.seatCategory.update({
        where: { id: category.id },
        data,
      });
      const updatedSubVenue = await updateSubVenueTotals(
        tx,
        category.subVenueId,
      );
      return { category: updated, subVenue: updatedSubVenue };
    });

    res.status(StatusCodes.OK).json({
      ...result,
      msg: "category updated successfully",
      success: true,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return fail(
        res,
        StatusCodes.CONFLICT,
        "this category name already exists in the subvenue",
      );
    }
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not update category");
  }
};

const deleteSeatCategory = async (req, res) => {
  try {
    const category = await loadOwnCategory(req, res);
    if (!category) return;

    const usedCount = await prisma.sessionCategoryPrice.count({
      where: { seatCategoryId: category.id },
    });
    if (usedCount > 0) {
      return fail(
        res,
        StatusCodes.CONFLICT,
        "this category is priced in a session, remove it from there first",
      );
    }

    const subVenue = await prisma.$transaction(async (tx) => {
      await tx.seatCategory.delete({ where: { id: category.id } });
      return updateSubVenueTotals(tx, category.subVenueId);
    });

    res.status(StatusCodes.OK).json({
      subVenue,
      msg: "category deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "could not delete category");
  }
};

export {
  createSeatCategory,
  getCategoriesBySubVenueId,
  updateSeatCategory,
  deleteSeatCategory,
};
