import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";

export default async function checkUserNotExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const user = await User.findOne({ email }).lean();
  console.log(user);

  // check if user exist
  if (user)
    return res.status(400).json({
      error: "User Already Exist!",
      message: "Provided Email already associated with a user",
    });

  next();
}
