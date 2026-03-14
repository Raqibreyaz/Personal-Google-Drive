import { ObjectId } from "mongodb";
import ApiError from "../helpers/apiError.js";
import { INVALID_ID } from "../constants/errorCodes.js";

const validateId = (req, res, next, id) => {
  if (!ObjectId.isValid(id))
    throw new ApiError(400, `Invalid ID: ${id}`, INVALID_ID);

  next();
};

export default validateId;
