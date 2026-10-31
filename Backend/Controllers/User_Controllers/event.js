import { StatusCodes } from "http-status-codes";
import { sendError, sendMessageError } from "../../utils/serviceError.js";
import {
  getEventByIdService,
  getEventsService,
  getEventsByFilterService,
} from "../../Sevices/User_Services/event.service.js";

const getEventById = async (req, res) => {
  try {
    const event = await getEventByIdService(req.params.id);
    res.status(StatusCodes.OK).json({ event, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch event");
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await getEventsService();
    res.status(StatusCodes.OK).json({ events, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch events");
  }
};

const getEventsByFilter = async (req, res) => {
  try {
    const data = await getEventsByFilterService(req.query);
    res.status(StatusCodes.OK).json(data);
  } catch (err) {
    sendMessageError(res, err, "Failed to fetch events");
  }
};

export { getEventById, getEvents, getEventsByFilter };
