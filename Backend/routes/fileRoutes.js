import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import { deleteFile, getFileContents, renameFile, saveFile } from "../controllers/fileControllers.js";

const router = express.Router();

router.param("fileId", validateId);

router.post("/", saveFile);

router.get("/:fileId", getFileContents);

router.patch("/:fileId", renameFile);

router.delete("/:fileId", deleteFile);

export default router;
