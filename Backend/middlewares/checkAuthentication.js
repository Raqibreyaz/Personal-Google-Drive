import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.signedCookies?.authToken ?? "";
  let user = null;

  if (authToken) {
    const { id, expiry } = JSON.parse(authToken);
    console.log(id, expiry);

    const currentTime = Date.now() / 1000;
    const daysPast = (currentTime - expiry) / 86400;

    console.log(daysPast);

    if (daysPast < 7) user = await User.findById(id);
  }

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user;

  next();
};

export default checkAuthentication;
