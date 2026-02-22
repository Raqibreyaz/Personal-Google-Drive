import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";
import { getUserSession } from "../utils/redis.js";

const checkAuthentication = async (req, res, next) => {
  const sessionId = req.signedCookies?.authToken ?? "";
  let user = null;

  console.log(sessionId);

  // when session exists then allow user
  if (sessionId) {
    const userId = await getUserSession(sessionId);
    if (userId) {
      user = await User.findById(userId).lean();
      req.session = { user, sessionId };
    }
  }

  // revoke the token also when exist
  if (!sessionId || !user) {
    if (sessionId) res.clearCookie("authToken");
    throw new ApiError(400, "Login to use the App!");
  }

  next();
};

export default checkAuthentication;
