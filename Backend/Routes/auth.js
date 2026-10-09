import express from "express";
import {
  participantSignup,
  organizerSignup,
  login,
  refresh,
  me,
  logout,
} from "../Controllers/auth.js";
import authenticate from "../Middleware/authentication.js";
const router = express.Router();

router.post("/participantSignup", participantSignup);
router.post("/organizerSignup", organizerSignup);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);
router.post("/logout", logout);

export default router;
