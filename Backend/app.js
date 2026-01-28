import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import setupDB from "./utils/setup.js";
import fileRoutes from "./routes/fileRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import checkAuthentication from "./middlewares/checkAuthentication.js";
import uploader from "./middlewares/uploader.js";

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

// add database access
try {
  const db = await setupDB();
  app.use((req, res, next) => {
    req.db = db;
    next();
  });
} catch (error) {
  process.exit(1);
}

app.use("/directory", checkAuthentication, directoryRoutes);
app.use(
  "/file",
  checkAuthentication,
  uploader.single("uploadFile"),
  fileRoutes,
);
app.use("/user", userRoutes);

app.use((err, req, res, next) => {
  // console.log(err);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Something went wrong!" });
});

app.listen(8080, () => console.log("server is running at port 8080"));
