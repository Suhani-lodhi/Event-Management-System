import { StatusCodes } from "http-status-codes";
import { ServiceError } from "../../utils/serviceError.js";
import {
  validateCategory,
  buildCategoryData,
} from "../seatCategory.service.js";

const bad = (msg) => new ServiceError(msg, StatusCodes.BAD_REQUEST);

const REQUIRED_VENUE_FIELDS = [
  "venueName",
  "addressLine1",
  "city",
  "state",
  "country",
  "pincode",
];

// validate data
export const validateCreateVenue = (body) => {
  if (REQUIRED_VENUE_FIELDS.some((field) => !body[field])) {
    throw bad("Some of the values are missing");
  }

  const { subVenues } = body;
  if (!Array.isArray(subVenues) || subVenues.length === 0) {
    throw bad("At least one sub-venue is required");
  }

  for (const sv of subVenues) {
    if (!sv) throw bad("Invalid sub-venue");

    const categories = sv.categories ?? [];
    if (!Array.isArray(categories)) throw bad("categories must be a list");

    const names = new Set();
    for (const c of categories) {
      validateCategory(c ?? {});
      const name = String(c.categoryName).trim().toLowerCase();
      if (names.has(name)) {
        throw bad(
          `duplicate category name "${String(c.categoryName).trim()}" in a sub-venue`,
        );
      }
      names.add(name);
    }
  }
};

// calculations
export const buildVenueData = (body, userId) => {
  const { venueName, addressLine1, city, state, country, pincode, subVenues } =
    body;

  return {
    venueName,
    addressLine1,
    city,
    state,
    country,
    pincode: Number(pincode),
    subVenueCount: subVenues.length,
    userId,
    subVenues: {
      create: subVenues.map((sv) => {
        const categories = (sv.categories ?? []).map(buildCategoryData);
        return {
          subVenueName: sv.subVenueName || null,
          categoryCount: categories.length,
          capacity: categories.length
            ? categories.reduce((total, c) => total + c.seatCount, 0)
            : null,
          seatCategories: { create: categories },
        };
      }),
    },
  };
};

// update function
export const buildVenueUpdateData = ({
  venueName,
  addressLine1,
  city,
  state,
  country,
  pincode,
}) => ({
  venueName,
  addressLine1,
  city,
  state,
  country,
  pincode: pincode ? Number(pincode) : undefined,
});

// delete
export const assertNoSessions = (sessionCount) => {
  if (sessionCount > 0) {
    throw new ServiceError(
      `${sessionCount} session(s) use this venue, delete or move them first`,
      StatusCodes.CONFLICT,
    );
  }
};

// subvenue validation
export const validateCreateSubVenue = ({
  subVenueName,
  categoryCount,
  capacity,
}) => {
  if (!subVenueName || categoryCount === undefined || capacity === undefined) {
    throw bad("Some values are missing");
  }
  if (Number.isNaN(Number(categoryCount)) || Number.isNaN(Number(capacity))) {
    throw bad("categoryCount and capacity must be numbers");
  }
};

export const buildSubVenueData = (
  { subVenueName, categoryCount, capacity },
  venueId,
) => ({
  subVenueName,
  categoryCount: Number(categoryCount),
  capacity: Number(capacity),
  venueId,
});

export const buildSubVenueUpdateData = ({
  subVenueName,
  categoryCount,
  capacity,
}) => ({
  subVenueName,
  categoryCount:
    categoryCount !== undefined ? Number(categoryCount) : undefined,
  capacity: capacity !== undefined ? Number(capacity) : undefined,
});
