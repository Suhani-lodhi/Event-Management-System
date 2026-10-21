import express from "express";
import { getSessionCategoryPricing } from "../../Controllers/sessionPricing.js";
import { createBooking } from "../../Controllers/User_Controllers/Booking.js";
const router = express.Router();

router.get("/getCategoriesPricing/:sessionId", getSessionCategoryPricing);
router.post("/createBookings", createBooking);


export default router;
