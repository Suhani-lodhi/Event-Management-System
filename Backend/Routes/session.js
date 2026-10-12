import express from "express";
import {
  createSession,
  deleteSessionById,
  getSessionById,
  getSessionsByEventId,
  updateSessionById,
} from "../Controllers/session.js";
const router = express.Router();

router.post("/createSession/:eventId", createSession);
router.get("/getSessions/:eventId", getSessionsByEventId);
router.get("/getSession/:sessionId", getSessionById);
router.patch("/updateSession/:sessionId", updateSessionById);
router.delete("/deleteSession/:sessionId", deleteSessionById);

export default router;
