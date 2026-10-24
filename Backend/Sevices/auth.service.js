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
import crypto from "crypto";
import { sendMail } from "../utils/mailer.js";
import { otpVerificationTemplate } from "../utils/mailTemplate.js";
import { generateOtp, hashOtp } from "../utils/otpGenerator.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;

const sanitizeUser = ({ password, ...safe }) => safe;

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

//Otp Verification wala module
const normalizeEmail = (email) => email.trim().toLowerCase();

const issueOtp = async (user) => {
  try {
    const otp = generateOtp();
    const data = {
      codeHash: hashOtp(otp),
      attemps: 0,
      lastSentAt: new Date(),
    };

    await prisma.emailOtp.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    const { subject, html } = otpVerificationTemplate(otp);
    await sendMail({
      to: user.email,
      subject,
      text: `Your 6-digit OTP is ${otp}. It expires in 5 minutes.`, // plain-text fallback
      html,
    });
  } catch (err) {
    console.error("OTP email failed:", err);
  }
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
  const email = normalizeEmail(data.email);
  const hashedPassword = await hashPassword(data.password);

  let user;
  try {
    user = await prisma.Users.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber ? data.phoneNumber : null,
      },
    });
  } catch (err) {
    handleCreateError(err);
  }
  await issueOtp(user);
  return { user: sanitizeUser(user) };
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

  const email = normalizeEmail(data.email);
  const hashedPassword = await hashPassword(data.password);

  let user, organizer;
  try {
    ({ user, organizer } = await prisma.$transaction(async (tx) => {
      const user = await tx.Users.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email,
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

  await issueOtp(user);
  return { user: sanitizeUser(user), organizer };
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
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    throw httpError(StatusCodes.BAD_REQUEST, "user not found with this email");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw httpError(StatusCodes.BAD_REQUEST, "Wrong password");
  }

  if (!user.isEmailVeified) {
    throw httpError(StatusCodes.FORBIDDEN, "Email not verified");
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

const verifyOtpService = async ({ email, otp } = {}) => {
  if (typeof email !== "string" || typeof otp !== "string" || !email || !otp) {
    throw httpError(StatusCodes.BAD_REQUEST, "Email and OTP are required");
  }

  const user = await prisma.users.findUnique({
    where: { email: normalizeEmail(email) },
    include: { emailOtp: true },
  });

  if (!user || !user.emailOtp) {
    throw httpError(StatusCodes.BAD_REQUEST, "Invalid or expired code");
  }

  const record = user.emailOtp;
  if (Date.now() - record.lastSentAt.getTime() > OTP_TTL_MS) {
    throw httpError(StatusCodes.BAD_REQUEST, "Code expired, request a new one");
  }

  if (record.attemps >= MAX_ATTEMPTS) {
    throw httpError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many attempts, request a new code",
    );
  }

  const match = hashOtp(otp.trim()) === record.codeHash;

  if (!match) {
    await prisma.emailOtp.update({
      where: { userId: user.id },
      data: { attemps: { increment: 1 } },
    });
    throw httpError(StatusCodes.BAD_REQUEST, "Invalid or expired code");
  }
  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: { isEmailVeified: true },
    }),
    prisma.emailOtp.delete({ where: { userId: user.id } }),
  ]);

  return { message: "Email verified" };
};

const resendOtpService = async ({ email } = {}) => {
  if (typeof email !== "string" || !email) {
    throw httpError(StatusCodes.BAD_REQUEST, "Email is required");
  }
  const generic = {
    message: "If the account exists, a new code has been sent",
  };

  const user = await prisma.users.findUnique({
    where: { email: normalizeEmail(email) },
    include: { emailOtp: true },
  });
  if (!user || user.isEmailVeified) return generic;
  if (
    user.emailOtp &&
    Date.now() - user.emailOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw httpError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Please wait before requesting another code",
    );
  }
  await issueOtp(user);
  return generic;
};
export {
  participantSignupService,
  organizerSignupService,
  loginService,
  refreshService,
  meService,
  verifyOtpService,
  resendOtpService,
};
