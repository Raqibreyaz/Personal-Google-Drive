import ApiError from "../helpers/apiError.js";
import {
  INVALID_CREDENTIALS,
  MISSING_DATA,
  ACCOUNT_DELETED,
} from "../constants/errorCodes.js";

export default async function verifyUserPassword(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { password } = req.body;
  if (!password)
    throw new ApiError(400, "Password is required!", MISSING_DATA);

  const user = req.user;

  if (user?.isDeleted)
    throw new ApiError(403, "User Account flagged!", ACCOUNT_DELETED);

  const isPasswordValid = user ? await user.comparePassword(password) : false;

  if (!user || !isPasswordValid)
    throw new ApiError(
      401,
      "Either user not exists or wrong password provided!",
      INVALID_CREDENTIALS,
    );

  next();
}
