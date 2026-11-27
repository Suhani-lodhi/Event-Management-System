/*
  Warnings:

  - A unique constraint covering the columns `[refundRef]` on the table `Cancellation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CancellationStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Cancellation" ADD COLUMN     "refundError" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_refundRef_key" ON "Cancellation"("refundRef");
