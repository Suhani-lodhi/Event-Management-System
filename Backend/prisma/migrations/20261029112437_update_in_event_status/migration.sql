-- This is an empty migration.

BEGIN;

-- =====================================================
-- 1. EventStatus: rename COMING_SOON in place, add CANCELLED
--    (CANCELLED isn't used anywhere in this file, so this is safe)
-- =====================================================
ALTER TYPE "EventStatus" RENAME VALUE 'COMING_SOON' TO 'PUBLISHED';
ALTER TYPE "EventStatus" ADD VALUE 'CANCELLED';

-- =====================================================
-- 2. RegistrationStatus: recreate the type with SCHEDULED
--    (a newly created type can be used in the same transaction)
-- =====================================================
CREATE TYPE "RegistrationStatus_new" AS ENUM ('OPEN', 'CLOSED', 'SCHEDULED');

ALTER TABLE "Session" ALTER COLUMN "registrationStatus" DROP DEFAULT;

ALTER TABLE "Session"
  ALTER COLUMN "registrationStatus" TYPE "RegistrationStatus_new"
  USING ("registrationStatus"::text::"RegistrationStatus_new");

ALTER TYPE "RegistrationStatus" RENAME TO "RegistrationStatus_old";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
DROP TYPE "RegistrationStatus_old";

ALTER TABLE "Session"
  ALTER COLUMN "registrationStatus" SET DEFAULT 'SCHEDULED';

-- =====================================================
-- 3. Event: scheduled go-live time
-- =====================================================
ALTER TABLE "Event" ADD COLUMN "activeAt" TIMESTAMP(3);

-- =====================================================
-- 4. Session: its own status
-- =====================================================
ALTER TABLE "Session"
  ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'DRAFTED';

-- =====================================================
-- 5. Indexes
-- =====================================================
CREATE INDEX "Event_status_activeAt_idx"
  ON "Event"("status", "activeAt");

CREATE INDEX "Session_eventId_status_idx"
  ON "Session"("eventId", "status");

CREATE INDEX "Session_registrationStatus_regStartdateTime_idx"
  ON "Session"("registrationStatus", "regStartdateTime");

CREATE INDEX "Session_registrationStatus_regEndDateTime_idx"
  ON "Session"("registrationStatus", "regEndDateTime");

-- =====================================================
-- 6. Backfill existing data
-- =====================================================

-- each session takes its event's current status
UPDATE "Session" s
SET "status" = e."status"
FROM "Event" e
WHERE s."eventId" = e."id"
  AND e."status" IS NOT NULL;

-- closed sessions whose registration window hasn't started yet
-- were really "scheduled"
UPDATE "Session"
SET "registrationStatus" = 'SCHEDULED'
WHERE "registrationStatus" = 'CLOSED'
  AND "regStartdateTime" > now();


COMMIT;