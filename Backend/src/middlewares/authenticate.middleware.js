import ApiError from "../helpers/apiError.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";

const checkAuthentication = async (req, res, next) => {
  const sessionId = req.signedCookies?.authToken ?? "";
  let user = null;

  console.log(sessionId)

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
    throw new ApiError(400, "Login to use the App!");
  }

  next();
};

export default checkAuthentication;
