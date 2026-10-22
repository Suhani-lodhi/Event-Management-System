import express from "express";
import { getSessionCategoryPricing } from "../../Controllers/sessionPricing.js";
import { cancelBooking, createBooking, getBookings, getBookingSummary, payBooking } from "../../Controllers/User_Controllers/Booking.js";
const router = express.Router();

router.get("/getCategoriesPricing/:sessionId", getSessionCategoryPricing);
router.post("/createBookings", createBooking);
router.get("/getBookings/:id", getBookings);
router.get("/bookings/:id/summary", getBookingSummary);
router.post("/bookings/:id/pay", payBooking);
router.post("/bookings/:id/cancel", cancelBooking);

export default router;
