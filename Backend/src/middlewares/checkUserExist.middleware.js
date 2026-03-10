import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";
import { MISSING_DATA, USER_NOT_FOUND } from "../constants/errorCodes.js";

export default async function checkUserExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!", MISSING_DATA);

  const user = await User.findOne({ email }).lean();

  if (!user)
    throw new ApiError(
      404,
      "Provided Email is not associated with any user",
      USER_NOT_FOUND,
    );

  req.user = user;

  next();
}
