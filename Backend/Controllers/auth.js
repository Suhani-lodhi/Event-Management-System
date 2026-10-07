import { StatusCodes } from "http-status-codes";
import {
  participantSignupService,
  organizerSignupService,
  loginService,
  refreshService,
} from "../Sevices/auth.service.js";

const sendError = (res, err) => {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  if (status === StatusCodes.INTERNAL_SERVER_ERROR) console.error(err);
  return res.status(status).json({
    success: false,
    message: err.statusCode ? err.message : "Internal server error",
  });
};

const participantSignup = async (req, res) => {
  try {
    const result = await participantSignupService(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Signed up successfully",
      ...result, // user, accessToken, refreshToken
    });
  } catch (err) {
    return sendError(res, err);
  }
};
const organizerSignup = async (req, res) => {
  try {
    const result = await organizerSignupService(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Signed up successfully",
      ...result,
    });
  } catch (err) {
    return sendError(res, err);
  }
};

const login = async (req, res) => {
  try {
    const result = await loginService(req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged in successfully",
      ...result,
    });
  } catch (err) {
    return sendError(res, err);
  }
};
const refresh = async (req, res) => {
  try {
    console.log("Refresh token Called..........");
    const result = await refreshService(req.body?.refreshToken);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Token refreshed",
      ...result,
    });
  } catch (err) {
    return sendError(res, err);
  }
};
export { participantSignup, organizerSignup, login, refresh };
