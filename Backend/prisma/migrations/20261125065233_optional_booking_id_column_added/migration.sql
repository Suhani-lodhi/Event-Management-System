-- DropForeignKey
ALTER TABLE "SessionSeat" DROP CONSTRAINT "SessionSeat_bookingId_fkey";

-- AlterTable
ALTER TABLE "SessionSeat" ALTER COLUMN "bookingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SessionSeat" ADD CONSTRAINT "SessionSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
