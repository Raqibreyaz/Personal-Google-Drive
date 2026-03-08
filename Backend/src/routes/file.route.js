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
  writeLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner, viewer, editor] only */
router.post(
  "/{:parentDirId}",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 3,
    timeGapInSec: 3,
  }),
  saveFile,
);

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
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  checkFileAccessAllowed,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  checkFileAccessAllowed,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

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
  deleteFile,
);

/* for [data_owner, app_owner, admin] only */
router.post(
  "/:userId/{:parentDirId}",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 3,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  saveFile,
);

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
  validate(getFileSchema),
  getFileContents,
);

router.patch(
  "/rename/:userId/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(renameFileSchema),
  renameFile,
);

router.patch(
  "/set-access/:userId/:fileId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(setAllowAnyoneSchema),
  setAllowAnyone,
);

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
  deleteFile,
);

export default router;
