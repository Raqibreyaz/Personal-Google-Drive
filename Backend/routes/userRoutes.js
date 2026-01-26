import express from "express";
import ApiError from "../utils/apiError.js";
import checkAuthentication from "../middlewares/checkAuthentication.js";

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
    return res.status(409).json({
      error: "User already exists",
      message: "a user with this email already exists",
    });

  // create user's root dir with user as null(currently)
  const createdDir = await directoryCollection.insertOne({
    name: `root-${email}`,
    user: null,
    parentDir: null,
  });

  // create the user with the root dir created
  const createdUser = await userCollection.insertOne({
    name,
    password,
    email,
    storageDir: createdDir.insertedId,
  });

  // now update the root dir with the user's id
  await directoryCollection.updateOne(
    { _id: createdDir.insertedId },
    { $set: { user: createdUser.insertedId } },
  );

  res
    .status(200)
    .cookie("authToken", createdUser.insertedId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({ message: "User registered!" });
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Email and Password are required!",
    });

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
