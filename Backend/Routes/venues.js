import express from "express";
import { getSubVenuesByVenueId, getVenues } from "../Controllers/venue.js";
const router = express.Router();

router.get("/venues", getVenues);
router.get("/subVenues", getSubVenuesByVenueId);

export default router;
