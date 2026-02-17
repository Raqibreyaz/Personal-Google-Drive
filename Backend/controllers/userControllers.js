import fs from "fs/promises";
import mongoose from "mongoose";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import ApiError from "../utils/apiError.js";
import createCookie from "../utils/createCookie.js";
import verifyIdToken from "../utils/verifyIdToken.js";
import createUserWithEssentials from "../utils/createUserWithEssentials.js";
import Role from "../utils/role.js";
import Provider from "../utils/provider.js";

export const registerUser = async (req, res, next) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const { userId, sessionId } = await createUserWithEssentials({
    name,
    email,
    password,
    role: Role.USER,
    authProvider: Provider.LOCAL,
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
  const userDoc = await User.findOne({ email: userData.email });

  // create the user with directory and session
  if (!userDoc) {
    const { userId, sessionId } = await createUserWithEssentials({
      name: userData.name,
      email: userData.email,
      authProvider: Provider.GOOGLE,
      role: Role.USER,
      password: null,
      picture: userData.picture,
      providerId: userData.sub,
    });

    createCookie(res, sessionId);
  }

  // when user exists then create a new session + limit the no of sessions
  if (userDoc) {
    // when user is not a google user
    if (userDoc.providerId !== String(userData.sub))
      throw new ApiError(
        400,
        `User already exists as a ${userDoc.authProvider} user`,
      );

    // when user got soft deleted
    if (userDoc.isDeleted)
      throw new ApiError(
        500,
        "Your account is flagged as deleted, Contact App Owner for further details!",
      );

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

export const loginWithGithub = async (req, res, next) => {
  const { code, state } = req.query;

  // 1. Validate state (CSRF protection)
  const savedState = req.signedCookies.oauth_state;

  if (!savedState || savedState !== state) {
    throw new ApiError(401, "Invalid OAuth state");
  }
  res.clearCookie("oauth_state");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    code,
  });

  const tokenRes = await fetch(
    `https://github.com/login/oauth/access_token?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );
  const { access_token } = await tokenRes.json();

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const { id: githubId, name, avatar_url } = await userRes.json();
  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const emails = await emailsRes.json();
  const primaryEmail = emails.find(({ primary }) => primary)?.email;

  const user = await User.findOne({ email: primaryEmail }).lean();

  if (!user) {
    // create the user with directory and session
    const { userId, sessionId } = await createUserWithEssentials({
      name,
      email: primaryEmail,
      authProvider: Provider.Github,
      role: Role.USER,
      password: null,
      picture: avatar_url,
      providerId: String(githubId),
    });

    createCookie(res, sessionId);
  }

  // when user exists then create a new session + limit the no of sessions
  if (user) {
    if (user.isDeleted)
      throw new ApiError(
        500,
        "Your account is flagged as deleted, Contact App Owner for further details!",
      );

    if (user.providerId !== String(githubId))
      throw new ApiError(
        400,
        `User already exists as a ${user.authProvider} user`,
      );

    // first check if user hasn't exhausted number of sessions limits
    const noOfSessions = await Session.countDocuments({ user: user._id });
    if (noOfSessions >= 2)
      await Session.findOneAndDelete(
        { user: user._id },
        { sort: { expiresAt: 1 } },
      );

    // create a new session for the user
    const userSession = await Session.insertOne({
      user: user._id,
      expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
    });

    createCookie(res, userSession.id);
  }

  res.redirect(`${process.env.FRONTEND_URI}/callback`);
};

export const getUser = (req, res, next) => {
  res.status(200).json({
    name: req.session.user.name,
    email: req.session.user.email,
    picture: req.session.user.picture,
    role: req.session.user.role,
  });
};

// delete user either soft/hard
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  const { permanent } = req.query;

  if (id === req.session.user._id.toString())
    throw new ApiError(400, "You cant delete yourself!");

  let user = null;

  if (req.receivedUser) user = req.receivedUser;
  else user = await User.findById(id);

  if (!user) throw new ApiError(404, "User not found!");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Session.deleteMany({ user: user._id }, { session });

    // soft delete
    if (!permanent) {
      await user.updateOne({ $set: { isDeleted: true } }, { session });
    }

    // hard delete
    else {
      await Directory.deleteMany({ user: user._id }, { session });
      const files = await File.find({ user: user._id }).select("extname");
      for (const file of files) {
        await fs.rm(`storage/${file.id}${file.extname}`);
        await file.deleteOne();
      }
      await user.deleteOne({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  res.status(200).json({ message: `successfully deleted user ${user.name}` });
};

// fetch all users(maybe soft deleted ones too!)
export const getAllUsers = async (req, res, next) => {
  const filter = {};

  // only owner will see the soft deleted users
  if (req.session.user.role !== "Owner") filter.isDeleted = { $ne: true };

  const users = await User.find(filter).select("name email isDeleted").lean();
  for (const user of users) {
    const sessionExist = await Session.exists({ user: user._id });
    user.isLoggedIn = !!sessionExist;
  }
  res.status(200).json(users);
};

// delete session and revoke the cookie
export const logoutUser = async (req, res, next) => {
  await Session.deleteOne({ _id: req.session.sessionId });
  res.clearCookie("authToken").status(204).end();
};

export const forceLogout = async (req, res, next) => {
  const { id } = req.params;
  await Session.deleteMany({ user: id });
  res.status(204).json({ message: "User sessions revoked!" });
};

// delete all sessions
export const logoutUserFromAllDevices = async (req, res, next) => {
  await Session.deleteMany({ user: req.session.user._id });
  res.clearCookie("authToken").status(204).end();
};

export const recoverUser = async (req, res, next) => {
  const { id } = req.params;
  const result = await User.updateOne(
    { _id: id },
    { $set: { isDeleted: false } },
  );

  if (!result.modifiedCount) throw new ApiError(404, "User not found!");

  res.status(200).json({ message: "User recovered successfully!" });
};

export const changeUserRole = async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) throw new ApiError(400, `Provide user's role to change!`);

  const result = await User.updateOne({ _id: id }, { $set: { role } });
  if (!result.modifiedCount) throw new ApiError(404, "User not found!");

  res.status(200).json({ message: "User role changes successfully!" });
};
