import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import { createUserSession } from "./redis.js";

export default async function createUserWithEssentials({
  name,
  email,
  password,
  authProvider,
  providerId,
  picture,
  role,
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
        role,
        storageDir: storageDirId,
      },
      { session },
    );

    const sessionId = await createUserSession(userId.toString(), 86400);

    await session.commitTransaction();

    return { userId: userId.toString(), sessionId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
}
