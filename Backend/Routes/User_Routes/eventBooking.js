import express from "express";
import { getSessionCategoryPricing } from "../../Controllers/Organizer_Controllers/sessionPricing.js";
import {
  getBookings,
  getBookingsByUserId,
  getBookingSummary,
  payForBooking,
} from "../../Controllers/User_Controllers/Booking.js";
const router = express.Router();

router.get("/getCategoriesPricing/:sessionId", getSessionCategoryPricing);
router.get("/bookings/:id", getBookings);
router.post("/bookingSummary", getBookingSummary);
router.post("/payForBooking", payForBooking);
router.get("/getBookings", getBookingsByUserId);

export default router;
