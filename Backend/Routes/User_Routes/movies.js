import express from "express";
import { cancelMovieBooking, confirmMovieBooking, getMovieSummary, payForMovieSeats, seatMap } from "../../Controllers/User_Controllers/movies.js";

const router = express.Router();

router.get('/session/:sessionId/seatMap', seatMap);
router.post('/session/getMovieTicketSummary', getMovieSummary);
router.post('/session/payForMovieSeats', payForMovieSeats);
router.post('/session/ConfirmMovieBooking', confirmMovieBooking)
router.patch('/cancelBooking/:bookingId', cancelMovieBooking);

export default router;
