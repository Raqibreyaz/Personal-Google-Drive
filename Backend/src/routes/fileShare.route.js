import express from "express";
import validateId from "../middlewares/validateId.middleware.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.middleware.js";
import {
  filesSharedWithMe,
  listUsersHavingTheFile,
  revokeAccess,
  shareFile,
} from "../controllers/fileShare.controller.js";
import checkFileAccessAllowed from "../middlewares/checkFileAccess.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  revokeFileAccessSchema,
  shareFileSchema,
} from "../validators/fileShare.validator.js";
import {
  readLimiter,
  writeLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";

const router = express.Router();
router.param("fileId", validateId);
router.param("userId", validateId);

// I can only see what files are shared with me
router.get(
  "/",
  readLimiter,
  throttleRequest("READ"),
  filesSharedWithMe,
);

// me,editor can only see users who access this file
router.get(
  "/:fileId",
  readLimiter,
  throttleRequest("READ"),
  checkFileAccessAllowed,
  listUsersHavingTheFile,
);

// me,editor can only share the file
router.post(
  "/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  validate(shareFileSchema),
  shareFile,
);

// me,editor can only revoke access of the file from other users
router.delete(
  "/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  validate(revokeFileAccessSchema),
  revokeAccess,
);

// file_owner,owner,admin can only see what files are shared with file_owner
router.get(
  "/:userId",
  readLimiter,
  throttleRequest("READ"),
  authorizeDataAccess,
  filesSharedWithMe,
);

// file_owner,owner,admin can only see users who access this file
router.get(
  "/:userId/:fileId",
  readLimiter,
  throttleRequest("READ"),
  authorizeDataAccess,
  listUsersHavingTheFile,
);

// file_owner,owner can only share the file
router.post(
  "/:userId/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  validate(shareFileSchema),
  shareFile,
);

// file_owner,owner can only revoke access of the file from other users
router.delete(
  "/:userId/:fileId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  validate(revokeFileAccessSchema),
  revokeAccess,
);

export default router;
