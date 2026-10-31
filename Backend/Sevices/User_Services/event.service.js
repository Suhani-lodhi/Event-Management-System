import { StatusCodes } from "http-status-codes";
import prisma from "../../index.js";
import { ServiceError, assertFound } from "../../utils/serviceError.js";

// events with these statuses are visible to participants
export const VISIBLE_STATUSES = ["COMING_SOON", "ACTIVE", "CLOSED", "DRAFTED"];

const CATEGORIES = ["MOVIE", "STANDUP", "GAME", "ACTIVITY"];
const GENRES = ["COMEDY", "HORROR", "ACTION", "FUN"];

// "movie, game" -> ["MOVIE", "GAME"]  (anything not in the allowed list is dropped)
const parseList = (value, allowed) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter((v) => allowed.includes(v));

export const getEventByIdService = async (eventId) => {
  if (!eventId) {
    throw new ServiceError("invalid event id", StatusCodes.BAD_REQUEST);
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, status: { in: VISIBLE_STATUSES } },
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
  assertFound(event, "event not found");

  return event;
};

export const getEventsService = () =>
  prisma.event.findMany({ orderBy: { id: "desc" } });

export const getEventsByFilterService = async (query) => {
  const { category, genre, search, page = 1, limit = 12 } = query;

  const categories = parseList(category, CATEGORIES);
  const genres = parseList(genre, GENRES);

  const where = {};
  if (categories.length) where.category = { in: categories };
  if (genres.length) where.genre = { in: genres };
  if (search) where.Title = { contains: search, mode: "insensitive" };

  const take = Math.min(Number(limit) || 12, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: { id: "desc" },
      select: {
        id: true,
        Title: true,
        Description: true,
        imageUrl: true,
        category: true,
        genre: true,
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    total,
    page: Number(page) || 1,
    totalPages: Math.ceil(total / take),
  };
};
