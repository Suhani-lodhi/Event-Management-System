import { StatusCodes } from "http-status-codes";
import { generateToken, hashToken, httpError } from "./token.service";
import prisma from "../index.js";
import bcrypt from "bcrypt";

const issueSession = async (user) => {
  const { accessToken, refreshToken } = generateToken;

  const user = await prisma.users.update({
    where: { id: user.id },
    data: { refreshToken: hashToken(refreshToken) },
  });
  return { accessToken, refreshToken };
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
export { participantSignupService, organizerSignupService, loginService };

// const participantSignup = async (data) => {
//   if (!data?.firstName || !data?.lastName || !data?.email || !data?.password) {
//     throw httpError(StatusCodes.BAD_REQUEST, "Required info not found");
//   }

//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(data.password, salt);
//   let user;
//   try {
//     user = await prisma.Users.create({
//       data: {
//         firstName: data.firstName,
//         lastName: data.lastName,
//         email: data.email.trim().toLowerCase(),
//         password: hashedPassword,
//         phoneNumber: data.phoneNumber ? data.phoneNumber : null,
//       },
//     });
//   } catch (err) {
//     throw err;
//   }
//   return issueSession(user);
// };
// export { participantSignup };
// const organizerSignup = async (data) => {
//   try {
//     const userData = {
//       firstName: data.firstName,
//       lastName: data.lastName,
//       email: data.email,
//       password: data.password,
//       phoneNumber: data.phoneNumber ? data.phoneNumber : null,
//       role: "ORGANIZER",
//     };

//     const salt = await bcrypt.genSalt(10);
//     userData.password = await bcrypt.hash(userData.password, salt);

//     const user = await prisma.Users.create({ data: userData });
//     if (!user) {
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//         msg: "user not created",
//         success: false,
//       });
//     }

//     const organizerData = {
//       userid: user.id,
//       displayName: data.displayName,
//       companyName: data.companyName,
//       alternatePhoneNumber: data.alternatePhoneNumber
//         ? data.alternatePhoneNumber
//         : null,
//       addressLine1: data.addressLine1,
//       city: data.city,
//       state: data.state,
//       country: data.country,
//       pincode: data.pincode,
//     };

//     const organizer = await prisma.Organizer.create({
//       data: organizerData,
//     });
//   } catch (err) {
//     return err;
//   }
//   return issueSession(user);
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
