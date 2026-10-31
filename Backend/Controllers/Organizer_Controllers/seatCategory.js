import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  assertFound,
  assertVenueOwner,
  sendError,
} from "../../utils/serviceError.js";
import {
  validateCategory,
  validateCategoryForUpdate,
  buildCategoryData,
  buildCategoryUpdateData,
  assertSeatCountAllowed,
  assertNotPriced,
} from "../../Sevices/seatCategory.service.js";

// db helper: recalculates count and capacity of a subvenue
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

// db helper: loads a category and checks the user owns its venue
const loadOwnCategory = async (categoryId, userId) => {
  const category = await prisma.seatCategory.findUnique({
    where: { id: categoryId },
    include: { subVenue: { include: { venue: true } } },
  });
  assertFound(category, "category not found");
  assertVenueOwner(category.subVenue.venue, userId);
  return category;
};

const createSeatCategory = async (req, res) => {
  try {
    const { subVenueId } = req.params;
    validateCategory(req.body);

    const subVenue = await prisma.subVenue.findUnique({
      where: { id: subVenueId },
      include: { venue: true },
    });
    assertFound(subVenue, "subvenue not found");
    assertVenueOwner(subVenue.venue, req.user.id);

    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.seatCategory.create({
        data: { subVenueId, ...buildCategoryData(req.body) },
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
    sendError(res, err, "could not create category");
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
    sendError(res, err, "could not fetch categories");
  }
};

const updateSeatCategory = async (req, res) => {
  try {
    validateCategoryForUpdate(req.body);

    const category = await loadOwnCategory(req.params.categoryId, req.user.id);
    const data = buildCategoryUpdateData(req.body);

    if (data.seatCount !== undefined) {
      const onSale = await prisma.sessionCategoryPrice.findFirst({
        where: {
          seatCategoryId: category.id,
          seatsForSale: { gt: data.seatCount },
        },
      });
      assertSeatCountAllowed(onSale);
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
    sendError(res, err, "could not update category");
  }
};

const deleteSeatCategory = async (req, res) => {
  try {
    const category = await loadOwnCategory(req.params.categoryId, req.user.id);

    const usedCount = await prisma.sessionCategoryPrice.count({
      where: { seatCategoryId: category.id },
    });
    assertNotPriced(usedCount);

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
    sendError(res, err, "could not delete category");
  }
};

export {
  createSeatCategory,
  getCategoriesBySubVenueId,
  updateSeatCategory,
  deleteSeatCategory,
};
