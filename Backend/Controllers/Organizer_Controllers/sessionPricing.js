import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import {
  assertFound,
  assertOwner,
  sendError,
} from "../../utils/serviceError.js";
import { buildSessionPricing } from "../../Sevices/sessionPricing.service.js";
import { findOrganizer } from "../../utils/findOrganizer.js";

const getSessionCategoryPricing = async (req, res) => {
  try {
    const categories = await prisma.sessionCategoryPrice.findMany({
      where: { sessionId: req.params.sessionId },
      include: { seatCategory: true },
      orderBy: { id: "asc" },
    });
    res.status(StatusCodes.OK).json({ categories, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch session pricing");
  }
};

// Body: { categories: [{ seatCategoryId, alias?, price, seatsForSale? }] }
// Replaces the session's pricing. Categories left out are not sold.
const setSessionCategoryPricing = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const organizer = await findOrganizer(req.user.id);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { event: true },
    });
    assertFound(session, "session not found");
    assertOwner(session.event, organizer, "not allowed");

    const categories = await prisma.seatCategory.findMany({
      where: { subVenueId: session.subVenueId },
    });
    const data = buildSessionPricing(req.body.categories, categories);

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
    sendError(res, err, "could not save session pricing");
  }
};

export { getSessionCategoryPricing, setSessionCategoryPricing };
