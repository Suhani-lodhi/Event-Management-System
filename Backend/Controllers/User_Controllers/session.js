import { StatusCodes } from "http-status-codes";
import { sendError } from "../../utils/serviceError.js";
import {
  getSessionByIdService,
  getSessionsService,
} from "../../Sevices/User_Services/session.service.js";

const getSessionById = async (req, res) => {
  try {
    const session = await getSessionByIdService(req.params.id);
    res.status(StatusCodes.OK).json({ session, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch session");
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await getSessionsService();
    res.status(StatusCodes.OK).json({ sessions, success: true });
  } catch (err) {
    sendError(res, err, "could not fetch sessions");
  }
};

export { getSessionById, getSessions };
