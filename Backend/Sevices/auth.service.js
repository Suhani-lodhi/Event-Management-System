import { StatusCodes } from "http-status-codes";
import {
  generateToken,
  hashToken,
  httpError,
  verifyRefreshToken,
} from "./token.service.js";
import prisma from "../index.js";
import "dotenv/config.js";
import bcrypt from "bcrypt";

const sanitizeUser = ({ password, refreshToken, ...safe }) => safe;

const issueSession = async (user) => {
  const { accessToken, refreshToken } = generateToken(user);

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const hashPassword = (password) => bcrypt.hash(password, 10);

const handleCreateError = (err) => {
  if (err.code === "P2002") {
    throw httpError(StatusCodes.CONFLICT, "Email already registered");
  }
  throw err;
};

const participantSignupService = async (data) => {
  if (
    !data?.firstName ||
    !data?.lastName ||
    !data?.email ||
    typeof data?.password !== "string" ||
    !data.password
  ) {
    throw httpError(StatusCodes.BAD_REQUEST, "Required info not found");
  }

  const hashedPassword = await hashPassword(data.password);

  let user;
  try {
    user = await prisma.Users.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        phoneNumber: data.phoneNumber ? data.phoneNumber : null,
      },
    });
  } catch (err) {
    handleCreateError(err);
  }

  return issueSession(user);
};

const organizerSignupService = async (data) => {
  const required = [
    "firstName",
    "lastName",
    "email",
    "displayName",
    "companyName",
    "addressLine1",
    "city",
    "state",
    "country",
    "pincode",
  ];
  const missing = required.filter((f) => !data?.[f]);
  if (missing.length || typeof data?.password !== "string" || !data.password) {
    throw httpError(StatusCodes.BAD_REQUEST, "Required info not found");
  }

  const hashedPassword = await hashPassword(data.password);

  let user, organizer;
  try {
    ({ user, organizer } = await prisma.$transaction(async (tx) => {
      const user = await tx.Users.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.trim().toLowerCase(),
          password: hashedPassword,
          phoneNumber: data.phoneNumber ? data.phoneNumber : null,
          role: "ORGANIZER",
        },
      });

      const organizer = await tx.Organizer.create({
        data: {
          userid: user.id,
          displayName: data.displayName,
          companyName: data.companyName,
          alternatePhoneNumber: data.alternatePhoneNumber
            ? data.alternatePhoneNumber
            : null,
          addressLine1: data.addressLine1,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
        },
      });

      return { user, organizer };
    }));
  } catch (err) {
    handleCreateError(err);
  }

  const session = await issueSession(user);
  return { ...session, organizer };
};

const loginService = async (data) => {
  const { email, password } = data ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    throw httpError(StatusCodes.BAD_REQUEST, "Email and password are required");
  }

  const user = await prisma.Users.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw httpError(StatusCodes.BAD_REQUEST, "user not found with this email");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw httpError(StatusCodes.BAD_REQUEST, "Wrong password");
  }

  return issueSession(user);
};

const refreshService = async (refreshToken) => {
  const user = await verifyRefreshToken(refreshToken);
  return generateToken(user);
};

const meService = async (id) => {
  const user = await prisma.users.findUnique({ where: { id } });
  if (!user) throw httpError(StatusCodes.UNAUTHORIZED, "User not found");
  return sanitizeUser(user);
};
export {
  participantSignupService,
  organizerSignupService,
  loginService,
  refreshService,
  meService,
};
