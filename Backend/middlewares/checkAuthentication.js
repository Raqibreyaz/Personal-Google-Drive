import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.cookies?.authToken;
  console.log(authToken);
  const user = authToken ? await User.findById(authToken) : null;

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user;

  next();
};

export default checkAuthentication;
