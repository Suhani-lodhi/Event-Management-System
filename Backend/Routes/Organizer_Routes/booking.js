import express from "express";
import { getBookingStats } from "../../Controllers/Organizer_Controllers/booking.js";

const router = express.Router();

router.get("/getBookingStats", getBookingStats)

export default router;