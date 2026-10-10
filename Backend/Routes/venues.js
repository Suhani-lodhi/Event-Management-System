import express from "express";
import {
  createVenue,
  deleteSubVenue,
  deleteVenue,
  getSubVenuesBySubVenueId,
  getSubVenuesByVenueId,
  getVenueById,
  getVenues,
  updateSubVenue,
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
router.patch("/updateSubVenue/:id", updateSubVenue);
router.delete("/deleteSubVenue/:id", deleteSubVenue);

export default router;
