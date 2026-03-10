import ApiError from "../helpers/apiError.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { AUTH_REQUIRED } from "../constants/errorCodes.js";

const checkAuthentication = async (req, res, next) => {
  const sessionId = req.signedCookies?.authToken ?? "";

  let user = null;

  // when session exists then allow user
  if (sessionId) {
    const session = await Session.findById(sessionId).lean();
    if (session) {
      user = await User.findById(session.user).lean();
      req.session = { user, sessionId };
    }
  }

  // revoke the token also when exist
  if (!sessionId || !user) {
    if (sessionId) res.clearCookie("authToken");
    throw new ApiError(401, "Login to use the App!", AUTH_REQUIRED);
  }

  next();
};

export default checkAuthentication;
