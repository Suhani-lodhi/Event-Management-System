-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
