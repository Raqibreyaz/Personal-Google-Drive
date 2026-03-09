import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";

export default async function checkUserExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const user = await User.findOne({ email }).lean();

  // check if user exist
  if (!user)
    return res.status(404).json({
      error: "User Not Found!",
      message: "Provided Email is not associated with any user",
    });

  req.user = user;

  next();
}
