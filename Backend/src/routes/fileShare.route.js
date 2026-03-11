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
  mutateLimiter,
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
  mutateLimiter,
  validate(shareFileSchema),
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
  shareFile,
);

// me,editor can only revoke access of the file from other users
router.delete(
  "/:fileId",
  mutateLimiter,
  validate(revokeFileAccessSchema),
  throttleRequest("MUTATE"),
  checkFileAccessAllowed,
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
  mutateLimiter,
  validate(shareFileSchema),
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  shareFile,
);

// file_owner,owner can only revoke access of the file from other users
router.delete(
  "/:userId/:fileId",
  mutateLimiter,
  validate(revokeFileAccessSchema),
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  revokeAccess,
);

export default router;
