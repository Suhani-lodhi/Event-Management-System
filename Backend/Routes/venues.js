import express from "express";
import {
  createVenue,
  deleteVenue,
  getSubVenuesBySubVenueId,
  getSubVenuesByVenueId,
  getVenueById,
  getVenues,
  updateVenue,
} from "../Controllers/venue.js";
const router = express.Router();

router.get("/venues", getVenues);
router.post("/createVenue", createVenue);
router.patch("/updateVenue/:id", updateVenue);
router.delete("/deleteVenue/:id", deleteVenue);
router.get("/subVenues/:venueId", getSubVenuesByVenueId);
router.get("/subVenue/:subVenueId", getSubVenuesBySubVenueId);
router.get("/venue/:id", getVenueById);

export default router;
