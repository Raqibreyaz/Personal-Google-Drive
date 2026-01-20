import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/directory", directoryRoutes);
app.use("/file", fileRoutes);

app.use((err, req, res, next) => {
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Something went wrong!" });
});

app.listen(8080, () => console.log("server is running at port 8080"));
