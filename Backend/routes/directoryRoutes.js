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
router.param("userId", validateId);

/* for [data_owner] only currently*/
router.get("/{:dirId}", getDirectoryContents);

router.post("/:dirname", createDirectory);

router.patch("/:dirId", updateDirectoryName);

router.delete("/:dirId", deleteDirectory);

/* for [data_owner, app_owner, admin] only */
router.get("/:userId/{:dirId}", authorizeDataAccess, getDirectoryContents);

router.post("/:userId/:dirname", authorizeDataAccess, createDirectory);

router.patch("/:userId/:dirId", authorizeDataAccess, updateDirectoryName);

router.delete("/:userId/:dirId", authorizeDataAccess, deleteDirectory);

export default router;
