import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.js";
import {
  createDirectory,
  deleteDirectory,
  getDirectoryContents,
  updateDirectoryName,
} from "../controllers/directoryControllers.js";

const router = express.Router();

router.param("dirId", validateId);

router.get("/{:dirId}", authorizeDataAccess, getDirectoryContents);

router.post("/:dirname", authorizeDataAccess, createDirectory);

router.patch("/:dirId", authorizeDataAccess, updateDirectoryName);

router.delete("/:dirId", authorizeDataAccess, deleteDirectory);

export default router;
