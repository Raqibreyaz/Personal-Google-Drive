import express from "express";
import { ObjectId } from "mongodb";
import ApiError from "../utils/apiError.js";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import { client } from "../utils/db.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const db = req.db;
  const userCollection = db.collection("users");
  const directoryCollection = db.collection("directories");

  // const userFound = usersDB.find((user) => user.email === email);
  const userFound = await userCollection.findOne({ email });
  if (userFound)
    throw new ApiError(409, "a user with this email already exists");

  const storageDirId = new ObjectId();
  const userId = new ObjectId();
  const session = client.startSession();
  session.startTransaction();

  try {
    // create user's root dir with user as null(currently)
    await directoryCollection.insertOne(
      {
        _id: storageDirId,
        name: `root-${email}`,
        user: userId,
        parentDir: null,
      },
      { session },
    );
    // {
    //   throw new ApiError(500, "something went wrong!");
    // }
    // create the user with the root dir created
    const createdUser = await userCollection.insertOne(
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

    res
      .status(200)
      .cookie("authToken", createdUser.insertedId, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .json({ message: "User registered!" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and Password are required!");

  const db = req.db;
  const userCollection = db.collection("users");

  const user = await userCollection.findOne({ email });
  if (!user || user.password !== password)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Either user not exists or wrong password provided!",
    });

  res
    .status(200)
    .cookie("authToken", user._id, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 86400 * 1000,
    })
    .json({ message: "User logged in!" });
});

router.get("/", checkAuthentication, (req, res, next) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", checkAuthentication, (req, res, next) => {
  res.clearCookie("authToken").status(204).end();
});

export default router;
