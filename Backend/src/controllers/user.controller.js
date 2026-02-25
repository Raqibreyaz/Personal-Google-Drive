import fs from "fs/promises";
import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import ApiError from "../helpers/apiError.js";
import FileShare from "../models/fileShare.model.js";

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
  const { userId } = req.params;
  const { permanent } = req.query;

  if (req.session.user._id.equals(userId))
    throw new ApiError(400, "You cant delete yourself!");

  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found!");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Session.deleteMany({ user: user._id }, { session });

    // soft delete
    if (!permanent || permanent === "false") {
      await user.updateOne({ $set: { isDeleted: true } }, { session });
    }

    // hard delete
    else {
      await Directory.deleteMany({ user: user._id }, { session });
      const files = await File.find({ user: user._id }).select("extname");
      for (const file of files) {
        await fs.rm(`storage/${file.id}${file.extname}`);
        await FileShare.deleteMany({ file: file._id }, { session });
        await file.deleteOne();
      }
      await FileShare.deleteMany({ user: user._id }, { session });
      await user.deleteOne({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  res.status(200).json({
    message: `successfully deleted user ${user.name}${permanent ? " permanently" : ""}`,
  });
};

// fetch all users(maybe soft deleted ones too!)
export const getAllUsers = async (req, res, next) => {
  const filter = {};

  // only owner will see the soft deleted users
  if (req.session.user.role !== "Owner") filter.isDeleted = { $ne: true };

  const users = await User.find(filter)
    .select("name email isDeleted role")
    .lean();
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
  const { userId } = req.params;
  await Session.deleteMany({ user: userId });
  res.status(200).json({ message: "User sessions revoked!" });
};

// delete all sessions
export const logoutUserFromAllDevices = async (req, res, next) => {
  await Session.deleteMany({ user: req.session.user._id });
  res.clearCookie("authToken").status(204).end();
};

export const recoverUser = async (req, res, next) => {
  const { userId } = req.params;
  const result = await User.updateOne(
    { _id: userId },
    { $set: { isDeleted: false } },
  );

  if (!result.modifiedCount) throw new ApiError(404, "User not found!");

  res.status(200).json({ message: "User recovered successfully!" });
};

export const changeUserRole = async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (req.session.user._id.equals(userId))
    throw new ApiError(400, `You can't change your own role!`);

  const result = await User.updateOne({ _id: userId }, { $set: { role } });
  if (!result.modifiedCount) throw new ApiError(404, "User not found!");

  res.status(200).json({ message: "User role changes successfully!" });
};
