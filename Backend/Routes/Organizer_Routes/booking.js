import express from "express";
import { getBookingDetails, getBookingStats } from "../../Controllers/Organizer_Controllers/booking.js";
import { getTickets } from "../../Controllers/User_Controllers/Booking.js";

const router = express.Router();

router.get("/getBookingStats", getBookingStats);
router.get("/getBookingDetails/:id", getBookingDetails);

export default router;