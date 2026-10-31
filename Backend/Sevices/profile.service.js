import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";
import { ServiceError, assertFound } from "../utils/serviceError.js";

const USER_FIELDS = ["firstName", "lastName", "phoneNumber"];
const ORGANIZER_FIELDS = [
  "displayName",
  "companyName",
  "alternatePhoneNumber",
  "addressLine1",
  "city",
  "state",
  "country",
  "pincode",
];

const pick = (obj, allowed) => {
  const result = {};
  for (const key of allowed) {
    if (obj?.[key] !== undefined) {
      result[key] = typeof obj[key] === "string" ? obj[key].trim() : obj[key];
    }
  }
  return result;
};

export const validateProfile = (body) => {
  const userData = pick(body, USER_FIELDS);
  const organizer = body ? pick(body.organizer, ORGANIZER_FIELDS) : null;

  if (Object.keys(userData).length === 0 && !organizer) {
    return { error: "No valid fields provided to update" };
  }

  for (const [key, value] of Object.entries({ ...userData, ...organizer })) {
    if (key === "pincode") {
      if (!Number.isInteger(value))
        return { error: "pincode must be a number" };
    } else if (key !== "phoneNumber" && key !== "alternatePhoneNumber") {
      if (typeof value !== "string" || value === "") {
        return { error: `${key} must be a non-empty string` };
      }
    }
  }

  return { userData, organizer };
};

// fields sent back to the frontend
const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  email: true,
  role: true,
  isEmailVeified: true,
  organizer: true,
};

export const getProfileService = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
  assertFound(user, "User not found");
  return user;
};

export const updateProfileService = async (userId, body) => {
  const { error, userData, organizer } = validateProfile(body);
  if (error) throw new ServiceError(error, StatusCodes.BAD_REQUEST);

  const existing = await prisma.users.findUnique({
    where: { id: userId },
    select: { organizer: { select: { id: true } } },
  });
  assertFound(existing, "User not found");

  return prisma.users.update({
    where: { id: userId },
    data: {
      ...userData,
      ...(organizer && { organizer: { update: organizer } }),
    },
    select: PROFILE_SELECT,
  });
};
