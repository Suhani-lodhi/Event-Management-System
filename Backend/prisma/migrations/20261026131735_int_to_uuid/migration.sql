-- This is an empty migration.
---now convert karenge ek ek karke
BEGIN;
-------Step 1 -----Naya column add krna

ALTER TABLE "Users"                ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Organizer"            ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Venue"                ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "SubVenue"             ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "SeatCategory"         ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "SeatDetail"           ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Event"                ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Session"              ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "SessionCategoryPrice" ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Booking"              ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "Tickets"              ADD COLUMN new_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Jaha bhi User Table refrence column hai vaha pe ek naya refrence column

-- //User_table ka idhr hoga
ALTER TABLE "EmailOtp"             ADD COLUMN new_user_id uuid;
ALTER TABLE "Organizer"            ADD COLUMN new_user_id uuid;
ALTER TABLE "Venue"                ADD COLUMN new_user_id uuid;
ALTER TABLE "Booking"              ADD COLUMN new_user_id uuid;
ALTER TABLE "Cancellation"         ADD COLUMN new_user_id uuid;

-- Organizer table ka idhr hoga
ALTER TABLE "Event"                ADD COLUMN new_organizer_id uuid;

-- Venue Table ka krna hai
ALTER TABLE "SubVenue"             ADD COLUMN new_venue_id uuid;

-- SubVenue Table ka krna hai
ALTER TABLE "SeatCategory"         ADD COLUMN new_subvenue_id uuid;
ALTER TABLE "Session"              ADD COLUMN new_subvenue_id uuid;

--Seat Category
ALTER TABLE "SeatDetail"           ADD COLUMN new_seatcat_id uuid;
ALTER TABLE "SessionCategoryPrice" ADD COLUMN new_seatcat_id uuid;

--Event
ALTER TABLE "Session"              ADD COLUMN new_event_id uuid;

-- Session table
ALTER TABLE "Event"                ADD COLUMN new_currentsession_id uuid;
ALTER TABLE "SessionCategoryPrice" ADD COLUMN new_session_id uuid;
ALTER TABLE "Booking"              ADD COLUMN new_session_id uuid;

-- Booking table
ALTER TABLE "Tickets"              ADD COLUMN new_booking_id uuid;
ALTER TABLE "Cancellation"         ADD COLUMN new_booking_id uuid;

-- SessionCategoryPrice table
ALTER TABLE "Tickets"              ADD COLUMN new_scp_id uuid;


-- /// data bhrna tables mai like jo refrence id ka vahi chahiye foriegn

-- Users
UPDATE "EmailOtp"               c SET new_user_id = p.new_id FROM "Users" p WHERE c."userId" = p.id;
UPDATE "Organizer"              c SET new_user_id = p.new_id FROM "Users" p WHERE c."userid" = p.id;
UPDATE "Venue"                  c SET new_user_id = p.new_id FROM "Users" p WHERE c."userId" = p.id;
UPDATE "Booking"                c SET new_user_id = p.new_id FROM "Users" p WHERE c."userId" = p.id;
UPDATE "Cancellation"           c SET new_user_id = p.new_id FROM "Users" p WHERE c."userId" = p.id;

-- Organizer
UPDATE "Event"                  c SET new_organizer_id = p.new_id FROM "Organizer" p WHERE c."organizerId" = p.id;
 
-- Venue
UPDATE "SubVenue"               c SET new_venue_id = p.new_id FROM "Venue" p WHERE c."venueId" = p.id;
 
-- SubVenue
UPDATE "SeatCategory"           c SET new_subvenue_id = p.new_id FROM "SubVenue" p WHERE c."subVenueId" = p.id;
UPDATE "Session"                c SET new_subvenue_id = p.new_id FROM "SubVenue" p WHERE c."subVenueId" = p.id;
 
-- SeatCategory
UPDATE "SeatDetail"             c SET new_seatcat_id = p.new_id FROM "SeatCategory" p WHERE c."seatCategoryId" = p.id;
UPDATE "SessionCategoryPrice"   c SET new_seatcat_id = p.new_id FROM "SeatCategory" p WHERE c."seatCategoryId" = p.id;
 
-- Event
UPDATE "Session"                c SET new_event_id = p.new_id FROM "Event" p WHERE c."eventId" = p.id;
 
-- Session
UPDATE "Event"                  c SET new_currentsession_id = p.new_id FROM "Session" p WHERE c."currentSessionId" = p.id;
UPDATE "SessionCategoryPrice"   c SET new_session_id = p.new_id FROM "Session" p WHERE c."sessionId" = p.id;
UPDATE "Booking"                c SET new_session_id = p.new_id FROM "Session" p WHERE c."sessionId" = p.id;
 
-- Booking
UPDATE "Tickets"                c SET new_booking_id = p.new_id FROM "Booking" p WHERE c."bookingId" = p.id;
UPDATE "Cancellation"           c SET new_booking_id = p.new_id FROM "Booking" p WHERE c."bookingId" = p.id;
 
-- SessionCategoryPrice
UPDATE "Tickets"                c SET new_scp_id = p.new_id FROM "SessionCategoryPrice" p WHERE c."sessionCategoryPriceId" = p.id;
 
--  // Dropping the foriegn keys now so that it may not refer to the old table to delete theor primary keys

ALTER TABLE "EmailOtp"             DROP COLUMN "userId";
ALTER TABLE "Organizer"            DROP COLUMN "userid";
ALTER TABLE "Venue"                DROP COLUMN "userId";
ALTER TABLE "SubVenue"             DROP COLUMN "venueId";
ALTER TABLE "SeatCategory"         DROP COLUMN "subVenueId";
ALTER TABLE "SeatDetail"           DROP COLUMN "seatCategoryId";
ALTER TABLE "Event"                DROP COLUMN "organizerId", DROP COLUMN "currentSessionId";
ALTER TABLE "Session"              DROP COLUMN "eventId", DROP COLUMN "subVenueId";
ALTER TABLE "SessionCategoryPrice" DROP COLUMN "sessionId", DROP COLUMN "seatCategoryId";
ALTER TABLE "Booking"              DROP COLUMN "userId", DROP COLUMN "sessionId";
ALTER TABLE "Cancellation"         DROP COLUMN "userId", DROP COLUMN "bookingId";
ALTER TABLE "Tickets"              DROP COLUMN "bookingId", DROP COLUMN "sessionCategoryPriceId";
 

-- // abb Primary keys delete krni padegi (number datatype wali ids)

ALTER TABLE "Users"                DROP COLUMN id;
ALTER TABLE "Organizer"            DROP COLUMN id;
ALTER TABLE "Venue"                DROP COLUMN id;
ALTER TABLE "SubVenue"             DROP COLUMN id;
ALTER TABLE "SeatCategory"         DROP COLUMN id;
ALTER TABLE "SeatDetail"           DROP COLUMN id;
ALTER TABLE "Event"                DROP COLUMN id;
ALTER TABLE "Session"              DROP COLUMN id;
ALTER TABLE "SessionCategoryPrice" DROP COLUMN id;
ALTER TABLE "Booking"              DROP COLUMN id;
ALTER TABLE "Tickets"              DROP COLUMN id;

-- // Renaming new colums back to id 
ALTER TABLE "Users"                RENAME COLUMN new_id TO id;  ALTER TABLE "Users"                ADD PRIMARY KEY (id);
ALTER TABLE "Organizer"            RENAME COLUMN new_id TO id;  ALTER TABLE "Organizer"            ADD PRIMARY KEY (id);
ALTER TABLE "Venue"                RENAME COLUMN new_id TO id;  ALTER TABLE "Venue"                ADD PRIMARY KEY (id);
ALTER TABLE "SubVenue"             RENAME COLUMN new_id TO id;  ALTER TABLE "SubVenue"             ADD PRIMARY KEY (id);
ALTER TABLE "SeatCategory"         RENAME COLUMN new_id TO id;  ALTER TABLE "SeatCategory"         ADD PRIMARY KEY (id);
ALTER TABLE "SeatDetail"           RENAME COLUMN new_id TO id;  ALTER TABLE "SeatDetail"           ADD PRIMARY KEY (id);
ALTER TABLE "Event"                RENAME COLUMN new_id TO id;  ALTER TABLE "Event"                ADD PRIMARY KEY (id);
ALTER TABLE "Session"              RENAME COLUMN new_id TO id;  ALTER TABLE "Session"              ADD PRIMARY KEY (id);
ALTER TABLE "SessionCategoryPrice" RENAME COLUMN new_id TO id;  ALTER TABLE "SessionCategoryPrice" ADD PRIMARY KEY (id);
ALTER TABLE "Booking"              RENAME COLUMN new_id TO id;  ALTER TABLE "Booking"              ADD PRIMARY KEY (id);
ALTER TABLE "Tickets"              RENAME COLUMN new_id TO id;  ALTER TABLE "Tickets"              ADD PRIMARY KEY (id);


-- /// Renaming Foriegn keys

ALTER TABLE "EmailOtp"             RENAME COLUMN new_user_id TO "userId";
ALTER TABLE "Organizer"            RENAME COLUMN new_user_id TO "userid";
ALTER TABLE "Venue"                RENAME COLUMN new_user_id TO "userId";
ALTER TABLE "Booking"              RENAME COLUMN new_user_id TO "userId";
ALTER TABLE "Cancellation"         RENAME COLUMN new_user_id TO "userId";

ALTER TABLE "Event"                RENAME COLUMN new_organizer_id TO "organizerId";

ALTER TABLE "SubVenue"             RENAME COLUMN new_venue_id TO "venueId";

ALTER TABLE "SeatCategory"         RENAME COLUMN new_subvenue_id TO "subVenueId";
ALTER TABLE "Session"              RENAME COLUMN new_subvenue_id TO "subVenueId";

ALTER TABLE "SeatDetail"           RENAME COLUMN new_seatcat_id TO "seatCategoryId";
ALTER TABLE "SessionCategoryPrice" RENAME COLUMN new_seatcat_id TO "seatCategoryId";

ALTER TABLE "Session"              RENAME COLUMN new_event_id TO "eventId";

ALTER TABLE "Event"                RENAME COLUMN new_currentsession_id TO "currentSessionId";

ALTER TABLE "SessionCategoryPrice" RENAME COLUMN new_session_id TO "sessionId";
ALTER TABLE "Booking"              RENAME COLUMN new_session_id TO "sessionId";
ALTER TABLE "Tickets"              RENAME COLUMN new_booking_id TO "bookingId";
ALTER TABLE "Cancellation"         RENAME COLUMN new_booking_id TO "bookingId";

ALTER TABLE "Tickets"              RENAME COLUMN new_scp_id TO "sessionCategoryPriceId";

-- setting not null before adding forign key
ALTER TABLE "EmailOtp"             ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Organizer"            ALTER COLUMN "userid" SET NOT NULL;
ALTER TABLE "Venue"                ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SubVenue"             ALTER COLUMN "venueId" SET NOT NULL;

ALTER TABLE "SeatCategory"         ALTER COLUMN "subVenueId" SET NOT NULL;

ALTER TABLE "SeatDetail"           ALTER COLUMN "seatCategoryId" SET NOT NULL;

ALTER TABLE "Event"                ALTER COLUMN "organizerId" SET NOT NULL;

ALTER TABLE "Session"              ALTER COLUMN "eventId" SET NOT NULL, ALTER COLUMN "subVenueId" SET NOT NULL;
ALTER TABLE "SessionCategoryPrice" ALTER COLUMN "sessionId" SET NOT NULL, ALTER COLUMN "seatCategoryId" SET NOT NULL;
ALTER TABLE "Booking"              ALTER COLUMN "userId" SET NOT NULL, ALTER COLUMN "sessionId" SET NOT NULL;
ALTER TABLE "Cancellation"         ALTER COLUMN "userId" SET NOT NULL, ALTER COLUMN "bookingId" SET NOT NULL;
ALTER TABLE "Tickets"              ALTER COLUMN "bookingId" SET NOT NULL, ALTER COLUMN "sessionCategoryPriceId" SET NOT NULL;


-- Adding Foriegn key o n the columns where it was needed
ALTER TABLE "EmailOtp"             ADD CONSTRAINT "EmailOtp_userId_fkey"                       FOREIGN KEY ("userId")                 REFERENCES "Users"(id)                ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Organizer"            ADD CONSTRAINT "Organizer_userid_fkey"                      FOREIGN KEY (userid)                   REFERENCES "Users"(id)                ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Venue"                ADD CONSTRAINT "Venue_userId_fkey"                          FOREIGN KEY ("userId")                 REFERENCES "Users"(id)                ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubVenue"             ADD CONSTRAINT "SubVenue_venueId_fkey"                      FOREIGN KEY ("venueId")                REFERENCES "Venue"(id)                ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "SeatCategory"         ADD CONSTRAINT "SeatCategory_subVenueId_fkey"               FOREIGN KEY ("subVenueId")             REFERENCES "SubVenue"(id)             ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "SeatDetail"           ADD CONSTRAINT "SeatDetail_seatCategoryId_fkey"             FOREIGN KEY ("seatCategoryId")         REFERENCES "SeatCategory"(id)         ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "Event"                ADD CONSTRAINT "Event_organizerId_fkey"                     FOREIGN KEY ("organizerId")            REFERENCES "Organizer"(id)            ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Event"                ADD CONSTRAINT "Event_currentSessionId_fkey"                FOREIGN KEY ("currentSessionId")       REFERENCES "Session"(id)              ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session"              ADD CONSTRAINT "Session_eventId_fkey"                       FOREIGN KEY ("eventId")                REFERENCES "Event"(id)                ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Session"              ADD CONSTRAINT "Session_subVenueId_fkey"                    FOREIGN KEY ("subVenueId")             REFERENCES "SubVenue"(id)             ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionCategoryPrice" ADD CONSTRAINT "SessionCategoryPrice_sessionId_fkey"        FOREIGN KEY ("sessionId")              REFERENCES "Session"(id)              ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "SessionCategoryPrice" ADD CONSTRAINT "SessionCategoryPrice_seatCategoryId_fkey"   FOREIGN KEY ("seatCategoryId")         REFERENCES "SeatCategory"(id)         ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking"              ADD CONSTRAINT "Booking_userId_fkey"                        FOREIGN KEY ("userId")                 REFERENCES "Users"(id)                ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking"              ADD CONSTRAINT "Booking_sessionId_fkey"                     FOREIGN KEY ("sessionId")              REFERENCES "Session"(id)              ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cancellation"         ADD CONSTRAINT "Cancellation_bookingId_fkey"                FOREIGN KEY ("bookingId")              REFERENCES "Booking"(id)              ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cancellation"         ADD CONSTRAINT "Cancellation_userId_fkey"                   FOREIGN KEY ("userId")                 REFERENCES "Users"(id)                ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tickets"              ADD CONSTRAINT "Tickets_bookingId_fkey"                     FOREIGN KEY ("bookingId")              REFERENCES "Booking"(id)              ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tickets"              ADD CONSTRAINT "Tickets_sessionCategoryPriceId_fkey"        FOREIGN KEY ("sessionCategoryPriceId") REFERENCES "SessionCategoryPrice"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adding Unique or indexes

CREATE UNIQUE INDEX "EmailOtp_userId_key"                                  ON "EmailOtp"("userId");
CREATE UNIQUE INDEX "Organizer_userid_key"                                 ON "Organizer"(userid);
CREATE UNIQUE INDEX "Event_currentSessionId_key"                           ON "Event"("currentSessionId");
CREATE UNIQUE INDEX "SessionCategoryPrice_sessionId_seatCategoryId_key"    ON "SessionCategoryPrice"("sessionId", "seatCategoryId");
CREATE INDEX "Venue_userId_idx"                                            ON "Venue"("userId");
CREATE INDEX "SessionCategoryPrice_seatCategoryId_idx"                     ON "SessionCategoryPrice"("seatCategoryId");
CREATE INDEX "Cancellation_bookingId_idx"                                  ON "Cancellation"("bookingId");

COMMIT;