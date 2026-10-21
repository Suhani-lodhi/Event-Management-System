-- DropForeignKey
ALTER TABLE "Organizer" DROP CONSTRAINT "Organizer_userid_fkey";

-- DropForeignKey
ALTER TABLE "SeatCategory" DROP CONSTRAINT "SeatCategory_subVenueId_fkey";

-- DropForeignKey
ALTER TABLE "SeatDetail" DROP CONSTRAINT "SeatDetail_seatCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "SubVenue" DROP CONSTRAINT "SubVenue_venueId_fkey";

-- CreateTable
CREATE TABLE "SessionCategoryPrice" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "seatCategoryId" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "seatsForSale" INTEGER NOT NULL,

    CONSTRAINT "SessionCategoryPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionCategoryPrice_seatCategoryId_idx" ON "SessionCategoryPrice"("seatCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCategoryPrice_sessionId_seatCategoryId_key" ON "SessionCategoryPrice"("sessionId", "seatCategoryId");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userid_fkey" FOREIGN KEY ("userid") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubVenue" ADD CONSTRAINT "SubVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatCategory" ADD CONSTRAINT "SeatCategory_subVenueId_fkey" FOREIGN KEY ("subVenueId") REFERENCES "SubVenue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatDetail" ADD CONSTRAINT "SeatDetail_seatCategoryId_fkey" FOREIGN KEY ("seatCategoryId") REFERENCES "SeatCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCategoryPrice" ADD CONSTRAINT "SessionCategoryPrice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCategoryPrice" ADD CONSTRAINT "SessionCategoryPrice_seatCategoryId_fkey" FOREIGN KEY ("seatCategoryId") REFERENCES "SeatCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
