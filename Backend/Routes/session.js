import express from "express";
import { createSession } from "../Controllers/session.js";
const router = express.Router();

router.post("/createSession/:eventId", createSession);

export default router;
