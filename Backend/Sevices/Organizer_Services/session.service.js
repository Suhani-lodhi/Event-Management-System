import { StatusCodes } from "http-status-codes";
import { ServiceError } from "../../utils/serviceError.js";

const assertValidDates = (start, end, regStart, regEnd, prefix = "") => {
  if (end <= start || regEnd <= regStart || regEnd > start) {
    throw new ServiceError(
      `${prefix}invalid dates: session must end after it starts, and registration must close before the session starts`,
      StatusCodes.BAD_REQUEST,
    );
  }
};

// create
export const validateSessions = (sessionsInput) => {
  if (!Array.isArray(sessionsInput) || sessionsInput.length === 0) {
    throw new ServiceError(
      "at least one session is required",
      StatusCodes.BAD_REQUEST,
    );
  }

  return sessionsInput.map((s, i) => {
    const {
      subVenueId,
      startDateTime,
      endDateTime,
      regStartdateTime,
      regEndDateTime,
    } = s;

    if (
      !subVenueId ||
      !startDateTime ||
      !endDateTime ||
      !regStartdateTime ||
      !regEndDateTime
    ) {
      throw new ServiceError(
        `session ${i}: required info not found`,
        StatusCodes.BAD_REQUEST,
      );
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const regStart = new Date(regStartdateTime);
    const regEnd = new Date(regEndDateTime);
    assertValidDates(start, end, regStart, regEnd, `session ${i}: `);

    return { subVenueId, start, end, regStart, regEnd };
  });
};

export const getUniqueSubVenueIds = (validated) => [
  ...new Set(validated.map((v) => v.subVenueId)),
];


export const assertSubVenuesFound = (count, ids) => {
  if (count !== ids.length) {
    throw new ServiceError(
      "one or more subVenues not found",
      StatusCodes.NOT_FOUND,
    );
  }
};

// create data
export const buildSessionData = (eventId, v) => ({
  eventId,
  subVenueId: v.subVenueId,
  startDateTime: v.start,
  endDateTime: v.end,
  regStartdateTime: v.regStart,
  regEndDateTime: v.regEnd,
});

// update
export const buildSessionUpdateData = (body, session) => {
  const {
    subVenueId,
    startDateTime,
    endDateTime,
    regStartdateTime,
    regEndDateTime,
    registrationStatus,
  } = body;

  const start = startDateTime ? new Date(startDateTime) : session.startDateTime;
  const end = endDateTime ? new Date(endDateTime) : session.endDateTime;
  const regStart = regStartdateTime
    ? new Date(regStartdateTime)
    : session.regStartdateTime;
  const regEnd = regEndDateTime
    ? new Date(regEndDateTime)
    : session.regEndDateTime;

  assertValidDates(start, end, regStart, regEnd);

  return {
    ...(subVenueId && { subVenueId }),
    startDateTime: start,
    endDateTime: end,
    regStartdateTime: regStart,
    regEndDateTime: regEnd,
    ...(registrationStatus && { registrationStatus }),
  };
};