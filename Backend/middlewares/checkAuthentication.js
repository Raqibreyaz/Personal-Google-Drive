import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.signedCookies?.authToken ?? "";
  let user = null;

  if (authToken) {
    const { userId, sessionId } = JSON.parse(authToken);
    console.log(userId, sessionId);

    // when session exists then allow user
    const session = await Session.findById(sessionId).lean();
    if (session) {
      user = await User.findById(userId).lean();
      req.session = { user, sessionId };
    }
  }

  // revoke the token also when exist
  if (!authToken || !user) {
    if (authToken) res.clearCookie("authToken");
    throw new ApiError(400, "Login to use the App!");
  }

  next();
};

export default checkAuthentication;
