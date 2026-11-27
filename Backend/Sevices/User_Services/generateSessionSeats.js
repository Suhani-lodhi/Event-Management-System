// services/generateSessionSeats.js
import prisma from "../../index.js";

const LEAD_MINUTES = 10;   

export const generateSessionSeats = async () => {
  const now = new Date();
  const dueBy = new Date(now.getTime() + LEAD_MINUTES * 60 * 1000);


  return prisma.$executeRaw`
    INSERT INTO "SessionSeat" (id, "sessionId", "seatDetailId", "sessionCategoryPriceId")
    SELECT gen_random_uuid(), s.id, d.id, scp.id
    FROM "Session" s
    JOIN "SubVenue" sv    ON sv.id = s."subVenueId"
    JOIN "Venue" v        ON v.id = sv."venueId" AND v.theater = true
    JOIN "SeatCategory" c ON c."subVenueId" = s."subVenueId"
    JOIN "SeatDetail" d   ON d."seatCategoryId" = c.id AND d."isActive"
    JOIN "SessionCategoryPrice" scp
           ON scp."sessionId" = s.id AND scp."seatCategoryId" = c.id
    WHERE s."regStartdateTime" <= ${dueBy}
      AND s."endDateTime" > ${now}
      AND s.status IN ('PUBLISHED', 'ACTIVE')
      AND NOT EXISTS (SELECT 1 FROM "SessionSeat" ss WHERE ss."sessionId" = s.id)
    ON CONFLICT ("sessionId", "seatDetailId") DO NOTHING
  `;
};