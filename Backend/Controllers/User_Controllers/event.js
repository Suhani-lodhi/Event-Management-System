import prisma from "../../index.js";
import { StatusCodes } from "http-status-codes";

const getEventById = async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "invalid event id",
        success: false,
      });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        status: { in: ["COMING_SOON", "ACTIVE", "CLOSED", "DRAFTED"] },
      },
      include: {
        sessions: {
          orderBy: { startDateTime: "asc" },
          include: {
            subVenue: {
              select: {
                subVenueName: true,
                venue: {
                  select: {
                    venueName: true,
                    addressLine1: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
        organizer: { select: { displayName: true, companyName: true } },
      },
    });

    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "event not found",
        success: false,
      });
    }

    res.status(StatusCodes.OK).json({ event, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch event",
      success: false,
    });
  }
};


const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { id: "desc" },
    });

    res.status(StatusCodes.OK).json({ events, success: true });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "could not fetch events",
      success: false,
    });
  }
};




const CATEGORIES = ['MOVIE', 'STANDUP', 'GAME', 'ACTIVITY'];
const parseList = (value, allowed) =>
  String(value || '')
    .split(',')
    .map((v) => v.trim().toUpperCase())
    .filter((v) => allowed.includes(v));


const getEventsByFilter = async (req, res) => {
  try {
    const { category, genre, search, page = 1, limit = 12 } = req.query;

    const categories = parseList(category, CATEGORIES);

    // Only public, published events for the participant side
    const where = {};

    if (categories.length) where.category = { in: categories };
    if (genre) where.genre = genre.toUpperCase();
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const take = Math.min(Number(limit) || 12, 50);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          category: true,
          genre: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
      total,
      page: Number(page) || 1,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};






export { getEventById, getEvents, getEventsByFilter };
