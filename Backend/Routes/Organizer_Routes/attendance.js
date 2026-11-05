import express from "express";
import { markAttendance } from "../../Controllers/Organizer_Controllers/attendance.js";


const router = express.Router();

router.patch("/:bookingId/attendance", markAttendance);

export default router;