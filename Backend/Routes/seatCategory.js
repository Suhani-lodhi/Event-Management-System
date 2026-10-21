import express from "express";
import {
  createSeatCategory,
  getCategoriesBySubVenueId,
  updateSeatCategory,
  deleteSeatCategory,
} from "../Controllers/seatCategory.js";
const router = express.Router();

router.get("/getCategories/:subVenueId", getCategoriesBySubVenueId);
router.post("/createCategory/:subVenueId", createSeatCategory);
router.patch("/updateCategory/:categoryId", updateSeatCategory);
router.delete("/deleteCategory/:categoryId", deleteSeatCategory);

export default router;
