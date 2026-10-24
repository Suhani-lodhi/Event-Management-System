import express from "express";
import { getProfile, updateProfile } from "../Controllers/profile.js";
import authenticate from "../Middleware/authentication.js";
const router = express.Router();
router.get("/profile/:id", authenticate, getProfile);
router.patch("/editProfile/:id", authenticate, updateProfile);
export default router;
