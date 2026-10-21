import express from "express";
import {
  createSeatCategory,
  getCategoriesBySubVenueId,
  updateSeatCategory,
  deleteSeatCategory,
} from "../Controllers/seatCategory.js";
const router = express.Router();

router.post("/createCategory/:subVenueId", createSeatCategory);
router.get("/getCategories/:subVenueId", getCategoriesBySubVenueId);
router.patch("/updateCategory/:categoryId", updateSeatCategory);
router.delete("/deleteCategory/:categoryId", deleteSeatCategory);

export default router;
