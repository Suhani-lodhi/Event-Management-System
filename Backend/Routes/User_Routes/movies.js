import express from "express";
import { seatMap } from "../../Controllers/User_Controllers/movies.js";

const router = express.Router();

router.get('/session/:sessionId/seatMap', seatMap);

export default router;
