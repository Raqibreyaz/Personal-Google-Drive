import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import crypto from "node:crypto";
import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";

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
    session.commitTransaction();

    // adding the current time of registering in the 'token'
    const expiryAgeInSec = 86400;

    const { secretKey } = req;
    const payload = JSON.stringify({
      id: userId,
      expiry: Math.round(Date.now() / 1000) + expiryAgeInSec,
    });

    const token = `${payload}.${crypto
      .createHash("sha256")
      .update(secretKey)
      .update(payload)
      .digest("hex")}`;

    res
      .status(200)
      .cookie("authToken", Buffer.from(token).toString("base64url"), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expiryAgeInSec * 1000,
      })
      .json({ message: "User registered!" });
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
  if (!user || user.password !== password)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Either user not exists or wrong password provided!",
    });

  // adding the current time of login in the 'token'
  const expiryAgeInSec = 86400;
  const { secretKey } = req;
  const userId = user._id.toString();

  const payload = JSON.stringify({
    id: userId,
    expiry: Math.round(Date.now() / 1000) + expiryAgeInSec,
  });

  const token = `${payload}.${crypto
    .createHash("sha256")
    .update(secretKey)
    .update(payload)
    .digest("hex")}`;

  res
    .status(200)
    .cookie("authToken", Buffer.from(token).toString("base64url"), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: expiryAgeInSec * 1000,
    })
    .json({ message: "User logged in!" });
};

export const getUser = (req, res, next) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
};

export const logoutUser = (req, res, next) => {
  res.clearCookie("authToken").status(204).end();
};
