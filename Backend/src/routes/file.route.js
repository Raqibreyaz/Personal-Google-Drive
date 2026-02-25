import express from "express";
import validateId from "../middlewares/validateId.middleware.js";
import {
  deleteFile,
  getFileContents,
  renameFile,
  saveFile,
  setAllowAnyone,
} from "../controllers/file.controller.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.middleware.js";
import checkFileAccessAllowed from "../middlewares/checkFileAccess.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import getFileSchema from "../validators/getFile.validator.js";
import renameFileSchema from "../validators/renameFile.validator.js";
import setAllowAnyoneSchema from "../validators/setAllowAnyone.validator.js";

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner, viewer, editor] only */
router.post("/{:parentDirId}", saveFile);

router.get(
  "/:fileId",
  checkFileAccessAllowed,
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:fileId",
  checkFileAccessAllowed,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:fileId",
  checkFileAccessAllowed,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

router.delete("/:fileId", checkFileAccessAllowed, deleteFile);

/* for [data_owner, app_owner, admin] only */
router.post("/:userId/{:parentDirId}", authorizeDataAccess, saveFile);

router.get(
  "/:userId/:fileId",
  authorizeDataAccess,
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:userId/:fileId",
  authorizeDataAccess,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:userId/:fileId",
  authorizeDataAccess,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

router.delete("/:userId/:fileId", authorizeDataAccess, deleteFile);

export default router;
