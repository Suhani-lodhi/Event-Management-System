import { StatusCodes } from "http-status-codes";
import { sendMessageError } from "../../utils/serviceError.js";
import {
  getBookingSummaryService,
  payForBookingService,
  getBookingsByUserIdService,
  cancelBookingService,
  getTicketsService,
} from "../../Sevices/User_Services/booking.service.js";

const getBookingSummary = async (req, res) => {
  try {
    const summary = await getBookingSummaryService(req.body);
    res.status(StatusCodes.OK).json(summary);
  } catch (err) {
    sendMessageError(res, err, "Could not generate booking summary");
  }
};

const payForBooking = async (req, res) => {
  try {
    const data = await payForBookingService(req.user.id, req.body);
    res.status(StatusCodes.CREATED).json(data);
  } catch (err) {
    sendMessageError(res, err, "Could not complete booking");
  }
};

const getBookingsByUserId = async (req, res) => {
  try {
    const data = await getBookingsByUserIdService(req.user?.id);
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, "Could not fetch bookings");
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { ticketIds } = req.body ?? {};
    const data = await cancelBookingService(
      req.user?.id,
      req.params.id,
      ticketIds,
    );
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, "Could not cancel booking");
  }
};

const getTickets = async (req, res) => {
  try {
    const data = await getTicketsService(req.user?.id, req.params.id);
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, "Could not fetch Tickets");
  }
};

export {
  getBookingSummary,
  payForBooking,
  getTickets,
  getBookingsByUserId,
  cancelBooking,
};
