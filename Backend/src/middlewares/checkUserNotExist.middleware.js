import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";
import { MISSING_DATA, DUPLICATE_USER } from "../constants/errorCodes.js";

export default async function checkUserNotExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!", MISSING_DATA);

  const user = await User.findOne({ email }).lean();

  if (user)
    throw new ApiError(
      409,
      "Provided Email already associated with a user",
      DUPLICATE_USER,
    );

  next();
}
