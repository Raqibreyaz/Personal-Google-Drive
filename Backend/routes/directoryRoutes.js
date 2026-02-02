import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import { createDirectory, deleteDirectory, getDirectoryContents, updateDirectoryName } from "../controllers/directoryControllers.js";

const router = express.Router();

router.param("dirId", validateId);

router.get("/{:dirId}", getDirectoryContents);

router.post("/:dirname", createDirectory);

router.patch("/:dirId", updateDirectoryName);

router.delete("/:dirId", deleteDirectory);

export default router;
