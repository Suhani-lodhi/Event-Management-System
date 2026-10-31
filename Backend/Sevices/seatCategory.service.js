import { StatusCodes } from "http-status-codes";
import { ServiceError } from "../utils/serviceError.js";

const bad = (msg) => new ServiceError(msg, StatusCodes.BAD_REQUEST);

const assertValidSeatCount = (seatCount) => {
  const count = Number(seatCount);
  if (!Number.isInteger(count) || count < 1) {
    throw bad("seatCount must be a whole number, 1 or more");
  }
};

export const validateCategory = ({ categoryName, seatCount }) => {
  if (!categoryName || !String(categoryName).trim()) {
    throw bad("categoryName is required");
  }
  assertValidSeatCount(seatCount);
};

export const validateCategoryForUpdate = ({ categoryName, seatCount } = {}) => {
  if (categoryName !== undefined && !String(categoryName).trim()) {
    throw bad("categoryName cannot be empty");
  }
  if (seatCount !== undefined) assertValidSeatCount(seatCount);
};

// data for create 
export const buildCategoryData = ({
  categoryName,
  categoryDetail,
  seatCount,
}) => ({
  categoryName: String(categoryName).trim(),
  categoryDetail: String(categoryDetail ?? "").trim() || null,
  seatCount: Number(seatCount),
});

// data for update: only the fields that were sent
export const buildCategoryUpdateData = ({
  categoryName,
  categoryDetail,
  seatCount,
}) => {
  const data = {};
  if (categoryName !== undefined)
    data.categoryName = String(categoryName).trim();
  if (categoryDetail !== undefined) data.categoryDetail = categoryDetail;
  if (seatCount !== undefined) data.seatCount = Number(seatCount);

  if (Object.keys(data).length === 0) throw bad("nothing to update");
  return data;
};


export const assertSeatCountAllowed = (onSale) => {
  if (onSale) {
    throw new ServiceError(
      `a session is selling ${onSale.seatsForSale} seats from this category, reduce that first`,
      StatusCodes.CONFLICT,
    );
  }
};

export const assertNotPriced = (usedCount) => {
  if (usedCount > 0) {
    throw new ServiceError(
      "this category is priced in a session, remove it from there first",
      StatusCodes.CONFLICT,
    );
  }
};
