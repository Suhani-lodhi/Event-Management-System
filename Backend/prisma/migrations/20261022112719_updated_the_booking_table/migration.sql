/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentRef` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "expiresAt",
DROP COLUMN "paymentRef";
