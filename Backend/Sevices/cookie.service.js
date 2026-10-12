import "dotenv/config.js";
import ms from "ms";

const { ACCESS_LIFETIME, REFRESH_LIFETIME } = process.env;

const cookieBase = {
  httpOnly: true,
};

export const accessCookie = { ...cookieBase, maxAge: ms(ACCESS_LIFETIME) };
export const refreshCookie = {
  ...cookieBase,
  maxAge: ms(REFRESH_LIFETIME),
  path: "/auth/refresh",
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, accessCookie);
  res.cookie("refreshToken", refreshToken, refreshCookie);
  console.log("Cookies set ho gyi.............");
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieBase);
  res.clearCookie("refreshToken", { ...cookieBase, path: "/auth/refresh" });
};
