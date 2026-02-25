import express from "express";
import validateId from "../middlewares/validateId.middleware.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.middleware.js";
import {
  createDirectory,
  deleteDirectory,
  getDirectoryContents,
  updateDirectoryName,
} from "../controllers/directory.controller.js";
import validate from "../middlewares/validate.middleware.js";
import createDirectorySchema from "../validators/createDirectory.validator.js";
import renameDirectorySchema from "../validators/renameDirectory.validator.js";

const router = express.Router();

router.param("dirId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner] only currently*/
router.get("/{:dirId}", getDirectoryContents);

router.post(
  "/{:parentDirId}",
  validate(createDirectorySchema),
  createDirectory,
);

router.patch("/:dirId", validate(renameDirectorySchema), updateDirectoryName);

router.delete("/:dirId", deleteDirectory);

/* for [data_owner, app_owner, admin] only */
router.get("/:userId/{:dirId}", authorizeDataAccess, getDirectoryContents);

router.post(
  "/:userId/:parentDirId",
  authorizeDataAccess,
  validate(createDirectorySchema),
  createDirectory,
);

router.patch(
  "/:userId/:dirId",
  authorizeDataAccess,
  validate(renameDirectorySchema),
  updateDirectoryName,
);

router.delete("/:userId/:dirId", authorizeDataAccess, deleteDirectory);

export default router;
