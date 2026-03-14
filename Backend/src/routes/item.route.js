import express from "express";
import validate from "../middlewares/validate.middleware.js";
import { bulkDeleteSchema } from "../validators/item.validator.js";
import { mutateLimiter } from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { bulkDelete } from "../controllers/item.controller.js";

const router = express.Router();

// Delete files and directories in bulk
router.delete(
  "/bulk-delete",
  mutateLimiter,
  validate(bulkDeleteSchema),
  throttleRequest("MUTATE"),
  bulkDelete
);

export default router;
