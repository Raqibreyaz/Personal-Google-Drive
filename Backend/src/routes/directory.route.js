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

const router = express.Router();

router.param("dirId", validateId);
router.param("userId", validateId);
router.param("parentDirId", validateId);

/* for [data_owner] only currently*/
router.get(
  "/{:dirId}",
  readLimiter,
  throttleRequest("READ"),
  getDirectoryContents,
);

router.post(
  "/{:parentDirId}",
  writeLimiter,
  throttleRequest("WRITE"),
  validate(createDirectorySchema),
  createDirectory,
);

router.patch(
  "/:dirId",
  writeLimiter,
  throttleRequest("MUTATE"),
  validate(renameDirectorySchema),
  updateDirectoryName,
);

router.delete(
  "/:dirId",
  writeLimiter,
  throttleRequest("MUTATE"),
  deleteDirectory,
);

/* for [data_owner, app_owner, admin] only */
router.get(
  "/:userId/{:dirId}",
  readLimiter,
  throttleRequest("READ"),
  authorizeDataAccess,
  getDirectoryContents,
);

router.post(
  "/:userId/:parentDirId",
  writeLimiter,
  throttleRequest("WRITE"),
  authorizeDataAccess,
  validate(createDirectorySchema),
  createDirectory,
);

router.patch(
  "/:userId/:dirId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  validate(renameDirectorySchema),
  updateDirectoryName,
);

router.delete(
  "/:userId/:dirId",
  writeLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  deleteDirectory,
);

export default router;
