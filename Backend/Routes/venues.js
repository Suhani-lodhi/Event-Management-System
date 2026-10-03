import express from "express";
import {
  createVenue,
  getSubVenuesByVenueId,
  getVenues,
  updateVenue,
} from "../Controllers/venue.js";
const router = express.Router();

router.get("/venues", getVenues);
router.get("/subVenues/:id", getSubVenuesByVenueId);
router.post("/createVenue", createVenue);
router.patch("/updateVenue/:id", updateVenue);

export default router;
