import prisma from "../../../index.js";

export const findOrganizer = (userId) =>
  prisma.organizer.findUnique({ where: { userid: userId } });
