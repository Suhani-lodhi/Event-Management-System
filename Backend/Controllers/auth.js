import { StatusCodes } from "http-status-codes";
import {
  participantSignupService,
  organizerSignupService,
  loginService,
  refreshService,
  meService,
} from "../Sevices/auth.service.js";
import { clearAuthCookies, setAuthCookies } from "../Sevices/cookie.service.js";

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
    const { user } = await participantSignupService(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Signed up successfully",
      user,
    });
  } catch (err) {
    return sendError(res, err);
  }
};

const organizerSignup = async (req, res) => {
  try {
    const { user, organizer } = await organizerSignupService(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Signed up successfully",
      user,
      organizer,
    });
  } catch (err) {
    return sendError(res, err);
  }
};

const login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await loginService(req.body);
    setAuthCookies(res, accessToken, refreshToken); // tokens go in HttpOnly cookies only
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged in successfully",
      user, // no tokens in the body
    });
  } catch (err) {
    return sendError(res, err);
  }
};

const refresh = async (req, res) => {
  try {
    const { accessToken, refreshToken } = await refreshService(
      req.cookies?.refreshToken,
    );
    setAuthCookies(res, accessToken, refreshToken);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Token refreshed",
    });
  } catch (err) {
    clearAuthCookies(res);
    return sendError(res, err);
  }
};

const logout = (req, res) => {
  clearAuthCookies(res);
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Logged out" });
};

const me = async (req, res) => {
  try {
    const user = await meService(req.user.id);
    return res.status(StatusCodes.OK).json({ success: true, user });
  } catch (err) {
    return sendError(res, err);
  }
};

export { participantSignup, organizerSignup, login, refresh, logout, me };
