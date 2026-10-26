-- CreateEnum
CREATE TYPE "CancellationStatus" AS ENUM ('REFUND', 'PENDING');

-- AlterTable
ALTER TABLE "Tickets" ADD COLUMN     "cancellationId" UUID;

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" UUID NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketCount" INTEGER NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "refundRef" TEXT,
    "status" "CancellationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cancellation_bookingId_idx" ON "Cancellation"("bookingId");

-- CreateIndex
CREATE INDEX "Tickets_cancellationId_idx" ON "Tickets"("cancellationId");

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_cancellationId_fkey" FOREIGN KEY ("cancellationId") REFERENCES "Cancellation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
