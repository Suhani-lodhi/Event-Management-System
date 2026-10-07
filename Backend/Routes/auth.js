import express from "express";
import {
  participantSignup,
  organizerSignup,
  login,
  refresh,
} from "../Controllers/auth.js";
const router = express.Router();

router.post("/participantSignup", participantSignup);
router.post("/organizerSignup", organizerSignup);
router.post("/login", login);
router.post("/refresh",refresh)
export default router;
