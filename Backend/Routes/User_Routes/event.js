import express from "express";
import { getEventById } from "../../Controllers/User_Controllers/event.js";
import {
  getSessionById,
  getSessions,
} from "../../Controllers/User_Controllers/session.js";
const router = express.Router();
router.get("/getEvent/:id", getEventById);
router.get("/getSession/:id", getSessionById);
router.get("/getSessions", getSessions);
export default router;
