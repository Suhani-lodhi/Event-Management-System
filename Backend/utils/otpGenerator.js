import "dotenv/config.js";
import crypto from "crypto";

export const generateOtp = (length = 6) => {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, "0");
};

export const hashOtp = (otp) =>
  crypto.createHmac("sha256", process.env.OTP_SECRET).update(otp).digest("hex");

// console.log(hashOtp("apple"));
