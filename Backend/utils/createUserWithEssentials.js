import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";

export default async function createUserWithEssentials({
  name,
  email,
  password,
  authProvider,
  providerId,
  picture,
}) {
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
        authProvider,
        providerId,
        picture,
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

    return { userId: userId.toString(), sessionId: userSession.id };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
}
