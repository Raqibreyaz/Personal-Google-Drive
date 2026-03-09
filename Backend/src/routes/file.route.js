import express from "express";
import validateId from "../middlewares/validateId.middleware.js";
import uploader from "../middlewares/upload.middleware.js";
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
import {
  getFileSchema,
  renameFileSchema,
  setAllowAnyoneSchema,
} from "../validators/file.validator.js";
import {
  readLimiter,
  writeLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner, viewer, editor] only */
router.post(
  "/{:parentDirId}",
  writeLimiter,
  throttleRequest("WRITE"),
  uploader.single("uploadFile"),
  saveFile,
);

router.get(
  "/:fileId",
  readLimiter,
  throttleRequest("READ"),
  checkFileAccessAllowed,
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

router.delete(
  "/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  deleteFile,
);

/* for [data_owner, app_owner, admin] only */
router.post(
  "/:userId/{:parentDirId}",
  writeLimiter,
  throttleRequest("WRITE"),
  authorizeDataAccess,
  uploader.single("uploadFile"),
  saveFile,
);

router.get(
  "/:userId/:fileId",
  readLimiter,
  throttleRequest("READ"),
  authorizeDataAccess,
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:userId/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:userId/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

router.delete(
  "/:userId/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  deleteFile,
);

export default router;
