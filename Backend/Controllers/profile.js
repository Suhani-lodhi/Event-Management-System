import { StatusCodes } from "http-status-codes";
import { sendMessageError } from "../utils/serviceError.js";
import {
  getProfileService,
  updateProfileService,
} from "../Sevices/profile.service.js";

const getProfile = async (req, res) => {
  try {
    const user = await getProfileService(req.user.id);
    res.status(StatusCodes.OK).json(user);
  } catch (err) {
    sendMessageError(res, err, "could not fetch profile");
  }
};

const updateProfile = async (req, res) => {
  try {
    const updated = await updateProfileService(req.user.id, req.body);
    res.status(StatusCodes.OK).json(updated);
  } catch (err) {
    sendMessageError(res, err, "could not update profile");
  }
};

export { getProfile, updateProfile };
