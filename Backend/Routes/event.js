import express from "express";
import {
  createEvent,
  deleteEventById,
  getEventById,
  getEventByOrganizerId,
  getEvents,
  updateEventById,
} from "../Controllers/event.js";
const router = express.Router();

router.post("/createEvent", createEvent);
router.get("/getEvents", getEvents);
router.get("/getEvent/:id", getEventById);
router.get("/getEventsbyOrganizerId", getEventByOrganizerId);
router.patch("/updateEvent/:id", updateEventById);
router.delete("/deleteEvent/:id", deleteEventById);

export default router;
