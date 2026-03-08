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
import { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();
router.param("fileId", validateId);
router.param("userId", validateId);

// I can only see what files are shared with me
router.get(
  "/",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  filesSharedWithMe,
);

// me,editor can only see users who access this file
router.get(
  "/:fileId",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  checkFileAccessAllowed,
  listUsersHavingTheFile,
);

// me,editor can only share the file
router.post(
  "/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  checkFileAccessAllowed,
  validate(shareFileSchema),
  shareFile,
);

// me,editor can only revoke access of the file from other users
router.delete(
  "/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  checkFileAccessAllowed,
  validate(revokeFileAccessSchema),
  revokeAccess,
);

// file_owner,owner,admin can only see what files are shared with file_owner
router.get(
  "/:userId",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  authorizeDataAccess,
  filesSharedWithMe,
);

// file_owner,owner,admin can only see users who access this file
router.get(
  "/:userId/:fileId",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  authorizeDataAccess,
  listUsersHavingTheFile,
);

// file_owner,owner can only share the file
router.post(
  "/:userId/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(shareFileSchema),
  shareFile,
);

// file_owner,owner can only revoke access of the file from other users
router.delete(
  "/:userId/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(revokeFileAccessSchema),
  revokeAccess,
);

export default router;
