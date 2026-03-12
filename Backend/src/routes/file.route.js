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
import {
  getFileSchema,
  renameFileSchema,
  setAllowAnyoneSchema,
} from "../validators/file.validator.js";
import {
  readLimiter,
  uploadLimiter,
  mutateLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import fileUpload from "../middlewares/limitedFileSizeUploader.middleware.js";

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner, viewer, editor] only */
router.post(
  "/{:parentDirId}",
  uploadLimiter,
  throttleRequest("WRITE"),
  fileUpload,
  saveFile,
);

router.get(
  "/:fileId",
  readLimiter,
  validate(getFileSchema),
  throttleRequest("READ"),
  checkFileAccessAllowed,
  getFileContents,
);

router.patch(
  "/rename/:fileId",
  mutateLimiter,
  validate(renameFileSchema),
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  renameFile,
);

router.patch(
  "/set-access/:fileId",
  mutateLimiter,
  validate(setAllowAnyoneSchema),
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  setAllowAnyone,
);

router.delete(
  "/:fileId",
  mutateLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  deleteFile,
);

/* for [data_owner, app_owner, admin] only */
router.post(
  "/:userId/{:parentDirId}",
  uploadLimiter,
  throttleRequest("WRITE"),
  authorizeDataAccess,
  fileUpload,
  saveFile,
);

router.get(
  "/:userId/:fileId",
  readLimiter,
  validate(getFileSchema),
  throttleRequest("READ"),
  authorizeDataAccess,
  getFileContents,
);

router.patch(
  "/rename/:userId/:fileId",
  mutateLimiter,
  validate(renameFileSchema),
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  renameFile,
);

router.patch(
  "/set-access/:userId/:fileId",
  mutateLimiter,
  validate(setAllowAnyoneSchema),
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  setAllowAnyone,
);

router.delete(
  "/:userId/:fileId",
  mutateLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  deleteFile,
);

export default router;
