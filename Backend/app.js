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

const app = express();

// add database access
try {
  await connectDB();
} catch (error) {
  console.log(error);
  process.exit(1);
}

app.use(cookieParser(process.env.COOKIE_PARSER_KEY));
app.use(
  cors({
    origin: [process.env.FRONTEND_URI],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/directory", checkAuthentication, directoryRoutes);
app.use(
  "/file",
  checkAuthentication,
  uploader.single("uploadFile"),
  fileRoutes,
);
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

app.listen(8080, () => console.log("server is running at port 8080"));
