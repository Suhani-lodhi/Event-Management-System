import express from "express";
import {
  createSession,
  getSessionById,
  getSessionsByEventId,
} from "../Controllers/session.js";
const router = express.Router();

router.post("/createSession/:eventId", createSession);
router.get("/getSessions/:eventId", getSessionsByEventId);
router.get("/getSession/:sessionId", getSessionById);

export default router;
