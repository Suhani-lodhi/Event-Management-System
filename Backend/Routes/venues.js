import express from "express";
import {
  createVenue,
  deleteVenue,
  getSubVenuesBySubVenueId,
  getSubVenuesByVenueId,
  getVenues,
  updateVenue,
  getVenuesByOrganizerId
} from "../Controllers/venue.js";
const router = express.Router();

router.get("/venues", getVenues);
router.post("/createVenue", createVenue);
router.patch("/updateVenue/:id", updateVenue);
router.delete("/deleteVenue/:id", deleteVenue);
router.get("/venuesByOrganizerId", getVenuesByOrganizerId)
router.get("/subVenues/:venueId", getSubVenuesByVenueId);
router.get("/subVenue/:subVenueId", getSubVenuesBySubVenueId);

export default router;
