import express from "express";
import cors from "cors";
import multer from "multer";
import path from 'node:path'
import crypto from 'node:crypto'
import cookieParser from "cookie-parser";
import fileRoutes from "./routes/fileRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ApiError from "./utils/apiError.js";
import usersDB from "./usersDB.json" with { type: "json" };

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./storage");
  },
  filename: function (req, file, cb) {
    cb(null, crypto.randomUUID() + path.extname(file.originalname));
  },
});

const uploader = multer({ storage });

const checkAuthentication = (req, res, next) => {
  const authToken = req.cookies?.authToken;
  const user = authToken ? usersDB.find((user) => user.id === authToken) : null;

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user

  next();
};

app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/directory", checkAuthentication, directoryRoutes);
app.use(
  "/file",
  checkAuthentication,
  uploader.array("uploadFile", 10),
  fileRoutes,
);
app.use("/user", userRoutes);

app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Something went wrong!" });
});

app.listen(8080, () => console.log("server is running at port 8080"));
