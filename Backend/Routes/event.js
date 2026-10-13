import express from "express";
import {
  createEvent,
  deleteEventById,
  getEventById,
  getEventByOrganizerId,
  getEvents,
  updateEventById,
} from "../Controllers/event.js";
import {upload} from '../Middleware/upload.js'
const router = express.Router();

router.post("/createEvent", upload.single("image"), createEvent);
router.get("/getEvents", getEvents);
router.get("/getEvent/:id", getEventById);
router.get("/getEventsbyOrganizerId", getEventByOrganizerId);
router.patch("/updateEvent/:id",upload.single("image"), updateEventById);
router.delete("/deleteEvent/:id", deleteEventById);

export default router;
