import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import createCookie from "../utils/createCookie.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";

export const registerUser = async (req, res, next) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const storageDirId = new ObjectId();
  const userId = new ObjectId();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // create user's root dir with user as null(currently)
    await Directory.insertOne(
      {
        _id: storageDirId,
        name: `root-${email}`,
        user: userId,
        parentDir: null,
      },
      { session },
    );

    // create the user with the root dir created
    await User.insertOne(
      {
        _id: userId,
        name,
        password,
        email,
        storageDir: storageDirId,
      },
      { session },
    );

    const userSession = await Session.insertOne(
      {
        user: userId,
        expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
      },
      { session },
    );

    await session.commitTransaction();

    createCookie(res, userId, userSession.id);
    res.status(200).json({ message: "User registered!" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and Password are required!");

  const user = await User.findOne({ email });
  const isPasswordValid = user && (await user.comparePassword(password));

  if (!user || !isPasswordValid)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Either user not exists or wrong password provided!",
    });

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

  createCookie(res, user.id, userSession.id);
  res.status(200).json({ message: "User logged in!" });
};

export const getUser = (req, res, next) => {
  res.status(200).json({
    name: req.session.user.name,
    email: req.session.user.email,
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
