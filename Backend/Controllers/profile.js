import { StatusCodes } from "http-status-codes";
import { validateProfile } from "../Sevices/profile.service.js";
import prisma from "../index.js";

const getProfile = async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user.id },
    // where: { id: Number(req.params.id) },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
      role: true,
      isEmailVeified: true,
      organizer: true,
    },
  });
  if (!user)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });
  res.status(StatusCodes.OK).json(user);
};

const updateProfile = async (req, res) => {
  const { error, userData, organizer } = validateProfile(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error });
  }

  const existing = await prisma.users.findUnique({
    where: { id: req.user.id },
    // where: { id: Number(req.params.id) },
    select: { organizer: { select: { id: true } } },
  });
  if (!existing)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "User not found" });

  const updated = await prisma.users.update({
    // where: { id: Number(req.params.id) },
    where: { id: req.user.id },
    data: {
      ...userData,
      ...(organizer && { organizer: { update: organizer } }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
      role: true,
      isEmailVeified: true,
      organizer: true,
    },
  });

  res.status(StatusCodes.OK).json(updated);
};

export { getProfile, updateProfile };
