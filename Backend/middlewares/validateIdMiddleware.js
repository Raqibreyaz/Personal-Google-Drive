import { ObjectId } from "mongodb";
import ApiError from "../utils/apiError.js";

const validateId = (req, res, next, id) => {
  if (!ObjectId.isValid(id)) throw new ApiError(400, `Invalid ID: ${id}`);

  next();
};

export default validateId;
