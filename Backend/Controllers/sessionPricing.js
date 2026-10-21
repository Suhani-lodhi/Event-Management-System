import { StatusCodes } from "http-status-codes";
import prisma from "../index.js";
import { buildSessionPricing } from "../Sevices/sessionPricing.service.js";
import fail from "../utils/fail.js";

const getSessionCategoryPricing = async (req, res) => {
  try {
    const categories = await prisma.sessionCategoryPrice.findMany({
      where: { sessionId: Number(req.params.sessionId) },
      include: { seatCategory: true },
      orderBy: { id: "asc" },
    });
    res.status(StatusCodes.OK).json({ categories, success: true });
  } catch (err) {
    console.error(err);
    fail(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "could not fetch session pricing",
    );
  }
};

// Body: { categories: [{ seatCategoryId, alias?, price, seatsForSale? }] }
// Replaces the session's pricing. Categories left out are not sold.
const setSessionCategoryPricing = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);

    const organizer = await prisma.organizer.findUnique({
      where: { userid: req.user.id },
    });
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });
    if (!session) return fail(res, StatusCodes.NOT_FOUND, "session not found");
    if (!organizer || session.event.organizerId !== organizer.id) {
      return fail(res, StatusCodes.FORBIDDEN, "not allowed");
    }

    const categories = await prisma.seatCategory.findMany({
      where: { subVenueId: session.subVenueId },
    });
    const { error, data } = buildSessionPricing(
      req.body.categories,
      categories,
    );
    if (error) return fail(res, StatusCodes.BAD_REQUEST, error);

    await prisma.$transaction([
      prisma.sessionCategoryPrice.deleteMany({ where: { sessionId } }),
      prisma.sessionCategoryPrice.createMany({
        data: data.map((d) => ({ ...d, sessionId })),
      }),
    ]);

    const saved = await prisma.sessionCategoryPrice.findMany({
      where: { sessionId },
      include: { seatCategory: true },
      orderBy: { id: "asc" },
    });
    res.status(StatusCodes.OK).json({
      categories: saved,
      msg: "session pricing saved successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    fail(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "could not save session pricing",
    );
  }
};

export { getSessionCategoryPricing, setSessionCategoryPricing };
