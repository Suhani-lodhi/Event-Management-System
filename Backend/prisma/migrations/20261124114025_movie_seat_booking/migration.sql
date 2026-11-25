/*
  Warnings:

  - A unique constraint covering the columns `[seatCategoryId,rowNumber,columnNumber]` on the table `SeatDetail` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `RowName` to the `SeatDetail` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionSeatStatus" AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED');

-- AlterTable
ALTER TABLE "SeatDetail" ADD COLUMN     "RowName" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tickets" ADD COLUMN     "sessionSeatId" UUID;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "theater" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SessionSeat" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "seatDetailId" UUID NOT NULL,
    "sessionCategoryPriceId" UUID NOT NULL,
    "status" "SessionSeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lockedUntil" TIMESTAMP(3),
    "bookingId" UUID NOT NULL,

    CONSTRAINT "SessionSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionSeat_sessionId_status_idx" ON "SessionSeat"("sessionId", "status");

-- CreateIndex
CREATE INDEX "SessionSeat_bookingId_idx" ON "SessionSeat"("bookingId");

-- CreateIndex
CREATE INDEX "SessionSeat_status_lockedUntil_idx" ON "SessionSeat"("status", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSeat_sessionId_seatDetailId_key" ON "SessionSeat"("sessionId", "seatDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatDetail_seatCategoryId_rowNumber_columnNumber_key" ON "SeatDetail"("seatCategoryId", "rowNumber", "columnNumber");

-- AddForeignKey
ALTER TABLE "SessionSeat" ADD CONSTRAINT "SessionSeat_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeat" ADD CONSTRAINT "SessionSeat_seatDetailId_fkey" FOREIGN KEY ("seatDetailId") REFERENCES "SeatDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeat" ADD CONSTRAINT "SessionSeat_sessionCategoryPriceId_fkey" FOREIGN KEY ("sessionCategoryPriceId") REFERENCES "SessionCategoryPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeat" ADD CONSTRAINT "SessionSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_sessionSeatId_fkey" FOREIGN KEY ("sessionSeatId") REFERENCES "SessionSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
