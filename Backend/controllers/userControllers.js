import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import ApiError from "../utils/apiError.js";
import createCookie from "../utils/createCookie.js";
import verifyIdToken from "../utils/verifyIdToken.js";
import createUserWithEssentials from "../utils/createUserWithEssentials.js";

export const registerUser = async (req, res, next) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const { userId, sessionId } = await createUserWithEssentials({
    name,
    email,
    password,
    authProvider: "local",
  });

  createCookie(res, sessionId);
  res.status(200).json({ message: "User registered!" });
};

export const loginUser = async (req, res, next) => {
  const { user } = req;
  if (!user)
    throw new ApiError(500, "Something went wrong while getting user!");

  // first check if user hasn't exhausted number of sessions limits
  const noOfSessions = await Session.countDocuments({ user: user._id });
  if (noOfSessions >= 2) {
    await Session.findOneAndDelete(
      { user: user._id },
      { sort: { expiresAt: 1 } },
    );
    // throw new ApiError(400, "No of Sessions Exceeded!");
  }

  // create a new session for the user
  const userSession = await Session.insertOne({
    user: user._id,
    expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
  });

  createCookie(res, userSession.id);
  res.status(200).json({ message: "User logged in!" });
};

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;
  const userData = await verifyIdToken(idToken);
  const userDoc = await User.findOne({ providerId: userData.sub });

  // create the user with directory and session
  if (!userDoc) {
    const { userId, sessionId } = await createUserWithEssentials({
      name: userData.name,
      email: userData.email,
      authProvider: "google",
      password: null,
      picture: userData.picture,
      providerId: userData.sub,
    });

    createCookie(res, sessionId);
  }

  // when user exists then create a new session + limit the no of sessions
  if (userDoc) {
    // first check if user hasn't exhausted number of sessions limits
    const noOfSessions = await Session.countDocuments({ user: userDoc._id });
    if (noOfSessions >= 2)
      await Session.findOneAndDelete(
        { user: userDoc._id },
        { sort: { expiresAt: 1 } },
      );

    // create a new session for the user
    const userSession = await Session.insertOne({
      user: userDoc._id,
      expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
    });

    createCookie(res, userSession.id);
  }

  res.status(200).json({ message: "User logged in!" });
};

export const getUser = (req, res, next) => {
  res.status(200).json({
    name: req.session.user.name,
    email: req.session.user.email,
    picture:req.session.user.picture
  });
};

// delete session and revoke the cookie
export const logoutUser = async (req, res, next) => {
  await Session.deleteOne({ _id: req.session.sessionId });
  res.clearCookie("authToken").status(204).end();
};

// delete all sessions
export const logoutUserFromAllDevices = async (req, res, next) => {
  await Session.deleteMany({ user: req.session.user._id });
  res.clearCookie("authToken").status(204).end();
};
