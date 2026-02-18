import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import checkAuthentication from "./middlewares/checkAuthentication.js";
import uploader from "./middlewares/uploader.js";
import fileRoutes from "./routes/fileRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import fileShareRoutes from "./routes/fileShareRoutes.js";

const app = express();

// add database access
try {
  await connectDB();
} catch (error) {
  console.log(error);
  process.exit(1);
}

app.use(
  cors({
    origin: [process.env.FRONTEND_URI],
    credentials: true,
  }),
);
app.use(cookieParser(process.env.COOKIE_PARSER_KEY));
app.use(express.json());

app.use("/directory", checkAuthentication, directoryRoutes);
app.use(
  "/file",
  checkAuthentication,
  uploader.single("uploadFile"),
  fileRoutes,
);
app.use("/share", checkAuthentication, fileShareRoutes);
app.use("/user", userRoutes);
app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  if (err.code === 121) err.message = "Invalid Fields!";
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `A user with this ${field} already exists!`;
  }
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || "Something went wrong!" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`server is running at port ${port}`));
