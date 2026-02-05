import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.cookies?.authToken ?? "";
  let user = null;

  if (authToken) {
    const jsonString = Buffer.from(authToken, "base64url").toString();
    console.log(jsonString);

    const { id, expiry } = JSON.parse(jsonString);
    console.log(id, expiry);

    const currentTime = Date.now() / 1000;
    const daysPast = (currentTime - expiry) / 1;

    console.log(daysPast);

    if (daysPast < 20) user = await User.findById(id);
  }

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user;

  next();
};

export default checkAuthentication;
