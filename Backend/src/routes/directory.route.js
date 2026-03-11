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
  uploadLimiter,
  mutateLimiter,
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
  uploadLimiter,
  validate(createDirectorySchema),
  throttleRequest("WRITE"),
  createDirectory,
);

router.patch(
  "/:dirId",
  mutateLimiter,
  validate(renameDirectorySchema),
  throttleRequest("MUTATE"),
  updateDirectoryName,
);

router.delete(
  "/:dirId",
  mutateLimiter,
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
  uploadLimiter,
  validate(createDirectorySchema),
  throttleRequest("WRITE"),
  authorizeDataAccess,
  createDirectory,
);

router.patch(
  "/:userId/:dirId",
  mutateLimiter,
  validate(renameDirectorySchema),
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  updateDirectoryName,
);

router.delete(
  "/:userId/:dirId",
  mutateLimiter,
  throttleRequest("MUTATE"),
  authorizeDataAccess,
  deleteDirectory,
);

export default router;
