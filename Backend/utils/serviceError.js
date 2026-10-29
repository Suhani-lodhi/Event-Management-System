import { StatusCodes } from "http-status-codes";

export class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

export const handleServiceError = (
  err,
  fallbackMsg = "something went wrong",
) => {
  if (err instanceof ServiceError) {
    return { status: err.status, body: { msg: err.message, success: false } };
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

// 403 no ownership
export const assertOwner = (owner, organizer, msg) => {
  if (!organizer || owner.organizerId !== organizer.id) {
    throw new ServiceError(msg, StatusCodes.FORBIDDEN);
  }
};

export const sendError = (res, err, fallbackMsg) => {
  const { status, body } = handleServiceError(err, fallbackMsg);
  return res.status(status).json(body);
};
