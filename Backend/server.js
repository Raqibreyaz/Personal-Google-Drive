import express from "express";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes.js";
import directoryRoutes from "./routes/directoryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/directory", directoryRoutes);
app.use("/files", fileRoutes);

app.listen(8080, () => console.log("server is running at port 8080"));
