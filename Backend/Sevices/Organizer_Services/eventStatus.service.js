import { StatusCodes } from "http-status-codes";
import { ServiceError } from "../../utils/serviceError.js";

const EVENT_STATUSES = ["DRAFTED", "COMING_SOON", "ACTIVE", "CLOSED"];
const REGISTRATION_STATUSES = ["OPEN", "CLOSED"];

export const validateEventStatus = (eventId, status) => {
  if (!eventId) {
    throw new ServiceError("invalid event id", StatusCodes.BAD_REQUEST);
  }
  if (!EVENT_STATUSES.includes(status)) {
    throw new ServiceError("invalid event status", StatusCodes.BAD_REQUEST);
  }
};

export const validateRegistrationStatus = (sessionId, registrationStatus) => {
  if (!sessionId) {
    throw new ServiceError("invalid session id", StatusCodes.BAD_REQUEST);
  }
  if (!REGISTRATION_STATUSES.includes(registrationStatus)) {
    throw new ServiceError(
      "invalid registration status",
      StatusCodes.BAD_REQUEST,
    );
  }
};

// publishing needs at least one priced session
export const assertCanPublish = (event, status) => {
  const goingLive = status === "COMING_SOON" || status === "ACTIVE";
  if (!goingLive) return;

  const hasPricedSession = event.sessions.some(
    (s) => s._count.sessionCategoryPrices > 0,
  );
  if (!hasPricedSession) {
    throw new ServiceError(
      "add at least one session with pricing before publishing the event",
      StatusCodes.CONFLICT,
    );
  }
};

// registration open for a published event with pricing
export const assertCanOpenRegistration = (session, registrationStatus) => {
  if (registrationStatus !== "OPEN") return;

  const eventStatus = session.event.status ?? "DRAFTED";
  if (eventStatus === "DRAFTED" || eventStatus === "CLOSED") {
    throw new ServiceError(
      "publish the event before opening registration",
      StatusCodes.CONFLICT,
    );
  }
  if (session._count.sessionCategoryPrices === 0) {
    throw new ServiceError(
      "set pricing for this session before opening registration",
      StatusCodes.CONFLICT,
    );
  }
};

// drafting or closing an event 
export const shouldCloseSessions = (status) =>
  status === "DRAFTED" || status === "CLOSED";
