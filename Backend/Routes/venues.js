import express from "express";
import { getSubVenuesByVenueId, getVenues } from "../Controllers/venue.js";
const router = express.Router();

router.get("/venues", getVenues);
router.get("/subVenues/:id", getSubVenuesByVenueId);

export default router;
