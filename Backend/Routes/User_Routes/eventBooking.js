import express from "express";
import { getSessionCategoryPricing } from "../../Controllers/Organizer_Controllers/sessionPricing.js";
import {
  cancelBooking,
  getTickets,
  getBookingsByUserId,
  getBookingSummary,
  payForBooking,
  createPaymentOrder,
} from "../../Controllers/User_Controllers/Booking.js";
const router = express.Router();

router.get("/getCategoriesPricing/:sessionId", getSessionCategoryPricing);
router.get("/bookings/tickets/:id", getTickets);
router.post("/bookingSummary", getBookingSummary);
router.get("/getBookings", getBookingsByUserId);
router.patch("/cancelBooking/:id", cancelBooking);
router.post("/createPaymentOrder", createPaymentOrder);
router.post("/payForBooking", payForBooking);

export default router;
