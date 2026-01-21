import express from "express";
import fs from "fs/promises";
import path from "path";
import ApiError from "../utils/apiError.js";
import usersDB from "../usersDB.json" with { type: "json" };
import dirsDB from "../dirsDB.json" with { type: "json" };

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const userFound = usersDB.find((user) => user.email === email);
  if (userFound)
    return res.status(409).json({
      error: "User already exists",
      message: "a user with this email already exists",
    });

  const storageDirname = `root-${email}`;
  const storageDirID = crypto.randomUUID();
  const userId = crypto.randomUUID();

  usersDB.push({
    id: userId,
    name,
    password,
    email,
    storageDir: storageDirID,
  });
  dirsDB.push({
    id: storageDirID,
    name: storageDirname,
    user: userId,
    parentDir: null,
    files: [],
    directories: [],
  });

  await fs.writeFile(
    path.join(process.cwd(), "dirsDB.json"),
    JSON.stringify(dirsDB),
  );

  await fs.writeFile(
    path.join(process.cwd(), "usersDB.json"),
    JSON.stringify(usersDB),
  );

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

// router.delete('/',(req,res,next)=>{

// })

export default router;
