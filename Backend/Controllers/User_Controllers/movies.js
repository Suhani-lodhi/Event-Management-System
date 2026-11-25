import { sendError } from "../../utils/serviceError.js";
import prisma from "../../index.js";
import { isUUID } from "class-validator";

const seatMap = async (req, res) => {
  const { sessionId } = req.params;

  if (!isUUID(sessionId)) {
    return res.status(400).json({ success: false, message: "Invalid session id" });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        startDateTime: true,
        event: { select: { id: true, Title: true, imageUrl: true } },
        subVenue: {
          select: {
            subVenueName: true,
            venue: { select: { venueName: true, city: true } },
            seatCategories: {                   
              select: {
                id: true,
                categoryName: true,
                rowCount: true,
                columnCount: true,
                seatCount: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Showtime not found" });
    }

    const now = new Date();                          

    const rows = await prisma.sessionSeat.findMany({
      where: { sessionId, seatDetail: { isActive: true } },
      select: {
        id: true,
        status: true,
        lockedUntil: true,
        seatDetail: {
          select: { rowNumber: true, RowName: true, columnNumber: true, columnName: true },
        },
        sessionCategoryPrice: { select: { alias: true, price: true } },
      },
      orderBy: [
        { seatDetail: { rowNumber: "asc" } },
        { seatDetail: { columnNumber: "asc" } },
      ],
    });

    const seats = rows.map((r) => ({
      id: r.id,
      category: r.sessionCategoryPrice.alias,
      price: r.sessionCategoryPrice.price,
      rowName: r.seatDetail.RowName,
      rowNumber: r.seatDetail.rowNumber,
      columnName: r.seatDetail.columnName,
      columnNumber: r.seatDetail.columnNumber,
      status: r.status === "LOCKED" && r.lockedUntil < now ? "AVAILABLE" : r.status,
    }));


    const { seatCategories, ...subVenue } = session.subVenue;
    const layout = {
      rowCount: new Set(seats.map((s) => s.rowNumber)).size,         
      columnCount: Math.max(0, ...seats.map((s) => s.columnNumber)),  
      categories: seatCategories.map((c) => ({
        id: c.id,
        name: c.categoryName,
        rowCount: c.rowCount,
        columnCount: c.columnCount,
        seatCount: c.seatCount,
      })),
    };

    res.status(200).json({
      success: true,
      session: { ...session, subVenue },
      layout,
      seats,
    });
  } catch (err) {
    sendError(res, err, "could not fetch seat map");
  }
};

export { seatMap };