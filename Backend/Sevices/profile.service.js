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
