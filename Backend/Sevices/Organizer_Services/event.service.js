import path from "path";
import { StatusCodes } from "http-status-codes";
import { removeUploadedFile, removeFile } from "../../utils/imagehandle.js";
import { ServiceError, handleServiceError } from "../../utils/serviceError.js";

//Error
export const assertFound = (value, msg) => {
  if (!value) throw new ServiceError(msg, StatusCodes.NOT_FOUND);
};
export const assertOwner = (event, organizer, msg) => {
  if (!organizer || event.organizerId !== organizer.id) {
    throw new ServiceError(msg, StatusCodes.FORBIDDEN);
  }
};

export const handleError = async (err, file, fallbackMsg) => {
  await removeUploadedFile(file);
  return handleServiceError(err, fallbackMsg);
};

//create
export const validateCreateEvent = ({ category, genre, Title }) => {
  if (!category || !genre || !Title) {
    throw new ServiceError("required info not found", StatusCodes.BAD_REQUEST);
  }
};

// data for create
export const buildEventData = (
  { category, genre, Title, Description },
  file,
) => ({
  category,
  genre,
  Title,
  Description: Description || null,
  imageUrl: file ? `/uploads/${file.filename}` : null,
});

// data for update
export const buildUpdateData = (
  { category, genre, Title, Description },
  file,
) => ({
  ...(category && { category }),
  ...(genre && { genre }),
  ...(Title && { Title }),
  ...(Description !== undefined && { Description }),
  ...(file && { imageUrl: `/uploads/${file.filename}` }),
});

//deletes the old image 
export const removeOldImage = async (imageUrl) => {
  if (imageUrl) {
    await removeFile(path.join("uploads", path.basename(imageUrl)));
  }
};
