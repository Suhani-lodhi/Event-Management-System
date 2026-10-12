/*
  Warnings:

  - You are about to drop the column `endDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `regEndDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `regStartdate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sessionCount` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `Description` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `Title` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `genre` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `regEndDate` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `regStartdate` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `organizerId` on the `Venue` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentSessionId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endDateTime` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regEndDateTime` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regStartdateTime` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDateTime` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subVenueId` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_organizerId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "endDate",
DROP COLUMN "regEndDate",
DROP COLUMN "regStartdate",
DROP COLUMN "registrationStatus",
DROP COLUMN "sessionCount",
DROP COLUMN "startDate",
ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "Description",
DROP COLUMN "Title",
DROP COLUMN "category",
DROP COLUMN "endDate",
DROP COLUMN "genre",
DROP COLUMN "regEndDate",
DROP COLUMN "regStartdate",
DROP COLUMN "startDate",
DROP COLUMN "status",
ADD COLUMN     "endDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "regEndDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "regStartdateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "subVenueId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "organizerId";

-- CreateIndex
CREATE UNIQUE INDEX "Event_currentSessionId_key" ON "Event"("currentSessionId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_currentSessionId_fkey" FOREIGN KEY ("currentSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_subVenueId_fkey" FOREIGN KEY ("subVenueId") REFERENCES "SubVenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
