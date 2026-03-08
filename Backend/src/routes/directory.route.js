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
import {
  createDirectorySchema,
  renameDirectorySchema,
} from "../validators/directory.validator.js";
import {
  readLimiter,
  writeLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();

router.param("dirId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner] only currently*/
router.get(
  "/{:dirId}",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  getDirectoryContents,
);

router.post(
  "/{:parentDirId}",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 3,
    timeGapInSec: 3,
  }),
  validate(createDirectorySchema),
  createDirectory,
);

router.patch(
  "/:dirId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  validate(renameDirectorySchema),
  updateDirectoryName,
);

router.delete(
  "/:dirId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  deleteDirectory,
);

/* for [data_owner, app_owner, admin] only */
router.get(
  "/:userId/{:dirId}",
  readLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 5,
    timeGapInSec: 2,
  }),
  authorizeDataAccess,
  getDirectoryContents,
);

router.post(
  "/:userId/:parentDirId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 3,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(createDirectorySchema),
  createDirectory,
);

router.patch(
  "/:userId/:dirId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  validate(renameDirectorySchema),
  updateDirectoryName,
);

router.delete(
  "/:userId/:dirId",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) =>
      req.session?.user._id.toString() || ipKeyGenerator(req.ip),
    freeRequests: 2,
    timeGapInSec: 3,
  }),
  authorizeDataAccess,
  deleteDirectory,
);

export default router;
