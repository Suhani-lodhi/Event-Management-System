import jwt from "jsonwebtoken";
import "dotenv/config.js";
import prisma from "../index.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_LIFETIME,
  REFRESH_LIFETIME,
} = process.env;

if (
  !JWT_ACCESS_SECRET ||
  !JWT_REFRESH_SECRET ||
  !ACCESS_LIFETIME ||
  !REFRESH_LIFETIME
) {
  throw new Error("Missing JWT environment variables");
}

const generateToken = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_LIFETIME, algorithm: "HS256" },
  );

  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_LIFETIME,
    algorithm: "HS256",
  });

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => jwt.verify(token, JWT_ACCESS_SECRET);

const verifyRefreshToken = async (token) => {
  if (!token) throw httpError(StatusCodes.UNAUTHORIZED, "No token Found");
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    throw httpError(StatusCodes.UNAUTHORIZED, "Invalid JWT token");
  }
  const user = await prisma.users.findUnique({
    where: { id: decoded.id },
  });
  if (!user) {
    throw httpError(StatusCodes.NOT_FOUND, "No User Found");
  }
  return user;
};

export {
  generateToken,
  verifyRefreshToken,
  verifyAccessToken,
  hashToken,
  httpError,
};
