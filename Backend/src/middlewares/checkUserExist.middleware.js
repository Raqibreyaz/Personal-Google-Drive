import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";


export default async function checkUserExist(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const user = await User.findOne({ email }).select("+password")

  if (!user)
    throw new ApiError(
      404,
      "Provided Email is not associated with any user"
    );

  req.user = user;

  next();
}
