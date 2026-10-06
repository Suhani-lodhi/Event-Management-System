import { StatusCodes } from "http-status-codes";
import {
  participantSignupService,
  organizerSignupService,
  loginService,
} from "../Sevices/auth.service";

const participantSignup = async (req, res) => {
  const result = await participantSignupService(req.body);
  res.status(StatusCodes.CREATED, "Signup Created Successfully", result);
};

// import { StatusCodes } from "http-status-codes";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import "dotenv/config.js";
// import prisma from "../index.js";
// // import { generateToken } from "../Sevices/auth.service.js";

// const participantSignup = async (req, res) => {
//   const userData = req.body;

//   if (
//     !userData ||
//     !userData.firstName ||
//     !userData.lastName ||
//     !userData.email ||
//     !userData.password
//   ) {
//     return res.status(400).json({
//       msg: "required info not found",
//       success: false,
//     });
//   }

//   const salt = await bcrypt.genSalt(10);
//   userData.password = await bcrypt.hash(userData.password, salt);

//   const user = await prisma.Users.create({ data: userData });
//   if (!user) {
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       msg: "user not created",
//       success: false,
//     });
//   }
//   const token = await jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_LIFETIME },
//   );

//   res.status(StatusCodes.CREATED).json({
//     token: token,
//     msg: "user signed up successfully",
//     success: true,
//   });

// };

// const organizerSignup = async (req, res) => {
//   const data = req.body;

//   const userData = {
//     firstName: data.firstName,
//     lastName: data.lastName,
//     email: data.email,
//     password: data.password,
//     phoneNumber: data.phoneNumber ? data.phoneNumber : null,
//     role: "ORGANIZER",
//   };

//   console.log("userData", userData);

//   const salt = await bcrypt.genSalt(10);
//   userData.password = await bcrypt.hash(userData.password, salt);

//   const user = await prisma.Users.create({ data: userData });
//   if (!user) {
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       msg: "user not created",
//       success: false,
//     });
//   }

//   const organizerData = {
//     userid: user.id,
//     displayName: data.displayName,
//     companyName: data.companyName,
//     alternatePhoneNumber: data.alternatePhoneNumber
//       ? data.alternatePhoneNumber
//       : null,
//     addressLine1: data.addressLine1,
//     city: data.city,
//     state: data.state,
//     country: data.country,
//     pincode: data.pincode,
//   };

//   const organizer = await prisma.Organizer.create({
//     data: organizerData,
//   });

//   const token = await jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_LIFETIME },
//   );

//   res.status(StatusCodes.CREATED).json({
//     token: token,
//     msg: "user signed up successfully",
//     success: true,
//   });
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       message: "required info not found",
//       success: false,
//     });
//   }

//   const user = await prisma.Users.findUnique({
//     where: { email: email },
//   });

//   if (!user) {
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       msg: "user not found with this email",
//       success: false,
//     });
//   }

//   const passwordMatch = await bcrypt.compare(password, user.password);
//   if (!passwordMatch) {
//     res.status(StatusCodes.BAD_REQUEST).json({
//       msg: "Wrong password",
//       success: false,
//     });
//   }

//   const token = await jwt.sign(
//     { id: user.id, email: user.email, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_LIFETIME },
//   );

//   res.status(StatusCodes.OK).json({
//     token,
//     email: user.email,
//     id: user.id,
//     msg: "user logged in successfully",
//     success: true,
//   });
// };

// export { participantSignup, organizerSignup, login };
