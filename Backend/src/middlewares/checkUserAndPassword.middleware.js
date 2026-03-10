import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";
import { INVALID_CREDENTIALS, MISSING_DATA, ACCOUNT_DELETED } from "../constants/errorCodes.js";

export default async function checkUserAndPassword(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and Password are required!", MISSING_DATA);

  const user = await User.findOne({ email }).select("+password");

  if (user?.isDeleted)
    throw new ApiError(403, "User Account flagged!", ACCOUNT_DELETED);

  const isPasswordValid = user ? await user.comparePassword(password) : false;

  if (!user || !isPasswordValid)
    throw new ApiError(
      401,
      "Either user not exists or wrong password provided!",
      INVALID_CREDENTIALS,
    );

  req.user = user;

  next();
}
