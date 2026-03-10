import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import fileRoutes from "./src/routes/file.route.js";
import directoryRoutes from "./src/routes/directory.route.js";
import userRoutes from "./src/routes/user.route.js";
import authRoutes from "./src/routes/auth.route.js";
import fileShareRoutes from "./src/routes/fileShare.route.js";
import checkAuthentication from "./src/middlewares/authenticate.middleware.js";
import {
  cleanupUploadedFile,
  globalErrorHandler,
} from "./src/middlewares/errorHandler.middleware.js";

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
app.use("/file", checkAuthentication, fileRoutes);
app.use("/share", checkAuthentication, fileShareRoutes);
app.use("/user", checkAuthentication, userRoutes);
app.use("/auth", authRoutes);

// clean up uploaded file on ANY error (authorization, validation, DB, etc.)
app.use(cleanupUploadedFile);

// global error handler — consistent { error, errorCode } response
app.use(globalErrorHandler);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () =>
  console.log(`server is running at port ${port}`),
);
