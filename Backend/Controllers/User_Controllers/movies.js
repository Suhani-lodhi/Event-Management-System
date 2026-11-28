import { StatusCodes } from "http-status-codes";
import { isUUID } from "class-validator";
import prisma from "../../index.js";
import { sendMessageError } from "../../utils/serviceError.js";
import { getBookingSummaryService } from "../../Sevices/User_Services/booking.service.js";
import { confirmBooking, payForMovieSeatService } from "../../Sevices/User_Services/movie.service.js";

const LEGEND_COLORS = ["#8B5CF6", "#0EA5E9", "#16A34A", "#F59E0B", "#EC4899"];

const STATUS_MAP = {
  AVAILABLE: "available",
  LOCKED: "held",
  BOOKED: "booked",
  BLOCKED: "blocked",
};

const seatMap = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!isUUID(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required",
      });
    }

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          select: { id: true, Title: true, settings: true },
        },

        subVenue: {
          include: {
            venue: {
              select: { venueName: true },
            },

            seatCategories: {
              include: {
                seatDetails: {
                  where: { isActive: true },
                  orderBy: [{ rowNumber: "asc" }, { columnNumber: "asc" }],
                },
              },
            },
          },
        },

        sessionCategoryPrices: true,
        sessionSeats: true,
      },
    });

    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const now = new Date();

    
    const categories = [...sessionData.subVenue.seatCategories].sort(
      (a, b) =>
        (a.seatDetails[0]?.rowNumber ?? 0) - (b.seatDetails[0]?.rowNumber ?? 0)
    );

    
    const sessionSeatMap = new Map(
      sessionData.sessionSeats.map((sessionSeat) => [
        sessionSeat.seatDetailId,
        sessionSeat,
      ])
    );

    const categoryPriceMap = new Map(
      sessionData.sessionCategoryPrices.map((item) => [
        item.seatCategoryId,
        item,
      ])
    );

    
    const seatSize = 24;
    const horizontalGap = 36;
    const verticalGap = 38;
    const leftMargin = 40;

    const maxColumns = Math.max(
      1,
      ...categories.map((category) =>
        Math.max(
          category.columnCount || 0,
          ...category.seatDetails.map((seat) => seat.columnNumber),
          0
        )
      )
    );

    const canvasWidth =
      leftMargin * 2 + (maxColumns - 1) * horizontalGap + seatSize;

    let currentY = 105;

    
    const sections = categories.map((category, categoryIndex) => {
      const seats = category.seatDetails; 
      const categoryPrice = categoryPriceMap.get(category.id)?.price;

      
      
      const firstRow = seats[0]?.rowNumber ?? 0;
      const lastRow = seats[seats.length - 1]?.rowNumber ?? 0;
      const rowsInSection = seats.length ? lastRow - firstRow + 1 : 0;

      const sectionTop = currentY;
      const sectionHeight =
        45 + Math.max(0, rowsInSection - 1) * verticalGap + seatSize;

      
      const kerusiSeats = seats
        .map((seat) => {
          const sessionSeat = sessionSeatMap.get(seat.id);

          
          if (!sessionSeat) return null;

          return {
            
            id: sessionSeat.id,

            label: seat.columnName,
            row: seat.RowName,
            col: seat.columnNumber,

            x: leftMargin + (seat.columnNumber - 1) * horizontalGap,
            y: sectionTop + 25 + (seat.rowNumber - firstRow) * verticalGap,

            type: category.id,

            
            ...(categoryPrice !== undefined && {
              price: {
                amount: Math.round(Number(categoryPrice) * 100),
                currency: "INR",
              },
            }),

            metadata: {
              seatDetailId: seat.id,
              sessionSeatId: sessionSeat.id,
              categoryId: category.id,
              categoryName: category.categoryName,
              columnName: seat.columnName,
              columnNumber: seat.columnNumber,
              rowNumber: seat.rowNumber,
            },
          };
        })
        .filter(Boolean);

      const section = {
        id: category.id,
        index: categoryIndex,
        label: category.categoryName,

        bounds: {
          x: 10,
          y: sectionTop,
          width: canvasWidth - 20,
          height: sectionHeight,
        },

        seats: kerusiSeats,
      };

      
      currentY += sectionHeight + 35;

      return section;
    });

    
    if (sections.length > 0) {
      sections[0].elements = [
        {
          id: "theatre-screen",
          kind: "screen",
          label: "SCREEN",
          x: canvasWidth / 2,
          y: 35,
          width: Math.min(canvasWidth - 60, 350),
          height: 18,
        },
      ];
    }

    
    const map = {
      kerusi: "1.0",

      id: sessionData.subVenue.id,

      name:
        sessionData.subVenue.subVenueName ||
        sessionData.subVenue.venue.venueName,

      domain: "cinema",
      locale: "en-IN",

      canvas: {
        width: canvasWidth,
        height: currentY,
      },

      seatSize,

      
      legend: categories.map((category, index) => {
        const price = categoryPriceMap.get(category.id)?.price;

        return {
          id: category.id,
          label:
            price !== undefined
              ? `${category.categoryName} · ₹${Number(price)}`
              : category.categoryName,
          color: LEGEND_COLORS[index % LEGEND_COLORS.length],
        };
      }),

      sections,
    };

    
    const stateSeats = {};

    sessionData.sessionSeats.forEach((sessionSeat) => {
      const holdExpired =
        sessionSeat.status === "LOCKED" &&
        sessionSeat.lockedUntil &&
        sessionSeat.lockedUntil < now;

      const status = holdExpired ? "AVAILABLE" : sessionSeat.status;

      stateSeats[sessionSeat.id] = {
        status: STATUS_MAP[status] || "blocked",

        ...(status === "LOCKED" &&
          sessionSeat.lockedUntil && {
            holdExpires: sessionSeat.lockedUntil.toISOString(),
          }),
      };
    });

    const state = {
      kerusi: "1.0",
      sessionId: sessionData.id,
      updatedAt: now.toISOString(),
      seats: stateSeats,
    };

    
    const prices = Object.fromEntries(
      categories.map((category) => {
        const categoryPrice = categoryPriceMap.get(category.id);
        return [
          category.id,
          {
            name: category.categoryName,
            price: categoryPrice ? Number(categoryPrice.price) : 0,
          },
        ];
      })
    );

    
    const kerusiSession = {
      kerusi: "1.0",
      id: sessionData.id,
      mapId: sessionData.subVenue.id,
      label: sessionData.event.Title,
      startsAt: sessionData.startDateTime.toISOString(),
      endsAt: sessionData.endDateTime.toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Seat layout fetched successfully",

      data: {
        map,
        session: kerusiSession,
        state,
        prices,
        settings: sessionData.event.settings
      },
    });
  } catch (error) {
    console.error("Get session seat layout error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch seat layout",
    });
  }
};

const getMovieSummary = async (req, res) => {
  try {
    const {sessionId, selectedSeats} = req.body;

    console.log(sessionId);
const tickets = await prisma.sessionSeat.findMany({
  where: { id: { in: selectedSeats }, sessionId },        
  select: { sessionCategoryPriceId: true },
});

if (tickets.length !== new Set(selectedSeats).size) {
  throw new Error("Invalid seat selection"), { status: 400 };
}

const countByCategory = (rows) => {
  const counts = new Map();
  for (const row of rows) {
    const id = row.sessionCategoryPriceId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts].map(([categoryId, count]) => ({ sessionCategoryPriceId: categoryId, quantity: count}));
};

const categoryCounts = countByCategory(tickets);

console.log(categoryCounts);

const data = await getBookingSummaryService({sessionId, items: categoryCounts});
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, "Could not complete booking");
  }
};


const payForMovieSeats = async (req, res) =>{
  const {selectedSeats, sessionId} = req.body;
  const userId = req.user.id;
  try{
     const data = await payForMovieSeatService({selectedSeats, sessionId, userId});
    res.status(StatusCodes.OK).json(data);
  }
  catch(err){
    sendMessageError(res, err, "Could not complete booking");
  }
}

const confirmMovieBooking = async (req, res) =>{
  const {selectedSeats, sessionId} = req.body;
  const userId = req.user.id;
  try{
     const data = await confirmBooking({selectedSeats, sessionId, userId});
    res.status(StatusCodes.OK).json(data);
  }
  catch(err){
    sendMessageError(res, err, "Could not complete booking");
  }
}

export { seatMap, getMovieSummary, payForMovieSeats, confirmMovieBooking };