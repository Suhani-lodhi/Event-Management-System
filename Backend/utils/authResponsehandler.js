import { accessCookie, refreshCookie } from "./cookieOptions.js";

export const authResponseHandler = (res, statusCode, message, userData) => {
  return res
    .status(statusCode)
    .cookie("accessToken", userData.accessToken, accessCookie)
    .cookie("refreshToken", userData.refreshToken, refreshCookie)
    .json({
      success: true,
      message,
      data: userData.user,
    });
};
