import { StatusCodes } from "http-status-codes";

export class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

const PRISMA_ERRORS = {
  P2002: {
    status: StatusCodes.CONFLICT,
    msg: "a record with this name already exists",
  },
  P2025: { status: StatusCodes.NOT_FOUND, msg: "record not found" },
  P2003: {
    status: StatusCodes.CONFLICT,
    msg: "linked record not found or still in use",
  },
};

export const handleServiceError = (
  err,
  fallbackMsg = "something went wrong",
) => {
  if (err instanceof ServiceError) {
    return { status: err.status, body: { msg: err.message, success: false } };
  }
  const known = PRISMA_ERRORS[err?.code];
  if (known) {
    return { status: known.status, body: { msg: known.msg, success: false } };
  }
  console.error(err);
  return {
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    body: { msg: fallbackMsg, success: false },
  };
};

// 404 empty
export const assertFound = (value, msg) => {
  if (!value) throw new ServiceError(msg, StatusCodes.NOT_FOUND);
};

// 403 organizer doesnt own
export const assertOwner = (owner, organizer, msg) => {
  if (!organizer || owner.organizerId !== organizer.id) {
    throw new ServiceError(msg, StatusCodes.FORBIDDEN);
  }
};

// 403
export const assertVenueOwner = (venue, userId, msg = "not allowed") => {
  if (venue.userId !== userId)
    throw new ServiceError(msg, StatusCodes.FORBIDDEN);
};

export const sendError = (res, err, fallbackMsg) => {
  const { status, body } = handleServiceError(err, fallbackMsg);
  return res.status(status).json(body);
};

export const sendMessageError = (res, err, fallbackMsg) => {
  const { status, body } = handleServiceError(err, fallbackMsg);
  return res.status(status).json({ message: body.msg });
};
