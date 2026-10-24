/*
  Warnings:

  - The `status` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userid]` on the table `Organizer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userid` to the `Organizer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('STANDUP', 'ACTIVITY', 'GAME', 'MOVIE');

-- CreateEnum
CREATE TYPE "EventGenre" AS ENUM ('COMEDY', 'HORROR', 'ACTION', 'FUN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFTED', 'COMING_SOON', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "userid" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "status",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "Category";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "venueName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" INTEGER NOT NULL,
    "subVenueCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubVenue" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "subVenueName" TEXT,
    "categoryCount" INTEGER NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "SubVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatCategory" (
    "id" SERIAL NOT NULL,
    "subVenueId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryDetail" TEXT,
    "seatCount" INTEGER NOT NULL,
    "rowCount" INTEGER,
    "columnCount" INTEGER,

    CONSTRAINT "SeatCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatDetail" (
    "id" SERIAL NOT NULL,
    "seatCategoryId" INTEGER NOT NULL,
    "columnName" TEXT NOT NULL,
    "columnNumber" INTEGER NOT NULL,
    "rowNumber" INTEGER NOT NULL,

    CONSTRAINT "SeatDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "category" "EventCategory" NOT NULL,
    "genre" "EventGenre" NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "regStartdate" TIMESTAMP(3) NOT NULL,
    "regEndDate" TIMESTAMP(3) NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "currentSessionId" INTEGER,
    "currentSession" INTEGER NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFTED',
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'CLOSED',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "category" "EventCategory" NOT NULL,
    "genre" "EventGenre" NOT NULL,
    "Title" TEXT,
    "Description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "regStartdate" TIMESTAMP(3),
    "regEndDate" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFTED',
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'CLOSED',

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_userid_key" ON "Organizer"("userid");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userid_fkey" FOREIGN KEY ("userid") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubVenue" ADD CONSTRAINT "SubVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatCategory" ADD CONSTRAINT "SeatCategory_subVenueId_fkey" FOREIGN KEY ("subVenueId") REFERENCES "SubVenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatDetail" ADD CONSTRAINT "SeatDetail_seatCategoryId_fkey" FOREIGN KEY ("seatCategoryId") REFERENCES "SeatCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
