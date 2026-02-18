import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.js";
import {
  filesSharedWithMe,
  listUsersHavingTheFile,
  revokeAccess,
  shareFile,
} from "../controllers/fileShareControllers.js";

const router = express.Router();
router.param("fileId", validateId);

router.get("/", filesSharedWithMe);

router.get("/:fileId", authorizeDataAccess, listUsersHavingTheFile);

router.post("/:fileId", authorizeDataAccess, shareFile);

router.delete("/:fileId", authorizeDataAccess, revokeAccess);

export default router;
