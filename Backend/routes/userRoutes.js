import express from "express";
import { ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "path";
import ApiError from "../utils/apiError.js";
import usersDB from "../usersDB.json" with { type: "json" };
import dirsDB from "../dirsDB.json" with { type: "json" };
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

  const storageDirname = `root-${email}`;
  // const storageDirID = crypto.randomUUID();
  // const userId = crypto.randomUUID();

  // usersDB.push({
  //   id: userId,
  //   name,
  //   password,
  //   email,
  //   storageDir: storageDirID,
  // });
  await userCollection.insertOne({
    name,
    password,
    email,
    storageDir: storageDir._id,
  });

  // dirsDB.push({
  //   id: storageDirID,
  //   name: storageDirname,
  //   user: userId,
  //   parentDir: null,
  //   files: [],
  //   directories: [],
  // });
  await directoryCollection.insertOne({
    name: storageDirname,
    user: user._id,
    parentDir: null,
    files: [],
    directories: [],
  });

  // await fs.writeFile(
  //   path.join(process.cwd(), "dirsDB.json"),
  //   JSON.stringify(dirsDB),
  // );

  // await fs.writeFile(
  //   path.join(process.cwd(), "usersDB.json"),
  //   JSON.stringify(usersDB),
  // );

  res
    .status(200)
    .cookie("authToken", userId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({ message: "User registered!" });
});

router.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Email and Password are required!",
    });

  const user = usersDB.find((user) => user.email === email);
  if (!user || user.password !== password)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Either user not exists or wrong password provided!",
    });

  res
    .status(200)
    .cookie("authToken", user.id, {
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
