import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";


export default async function checkUserNotExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const user = await User.findOne({ email }).lean();

  if (user)
    throw new ApiError(
      409,
      "Provided Email already associated with a user"
    );

  next();
}
