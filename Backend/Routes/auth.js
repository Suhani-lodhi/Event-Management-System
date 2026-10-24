import express from "express";
import {
  participantSignup,
  organizerSignup,
  login,
  refresh,
  me,
  logout,
  verifyOtp,
  resendOtp,
} from "../Controllers/auth.js";
import authenticate from "../Middleware/authentication.js";
const router = express.Router();

router.post("/participantSignup", participantSignup);
router.post("/organizerSignup", organizerSignup);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);
router.post("/logout", logout);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);

export default router;
