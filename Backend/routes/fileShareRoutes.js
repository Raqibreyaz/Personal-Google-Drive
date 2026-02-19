import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.js";
import {
  filesSharedWithMe,
  listUsersHavingTheFile,
  revokeAccess,
  shareFile,
} from "../controllers/fileShareControllers.js";
import checkFileAccessAllowed from "../middlewares/checkFileAccessAllowed.js";

const router = express.Router();
router.param("fileId", validateId);

// I can only see what files are shared with me
router.get("/", filesSharedWithMe);

// me,editor can only see users who access this file
router.get("/:fileId", checkFileAccessAllowed, listUsersHavingTheFile);

// me,editor can only share the file
router.post("/:fileId", checkFileAccessAllowed, shareFile);

// me,editor can only revoke access of the file from other users
router.delete("/:fileId", checkFileAccessAllowed, revokeAccess);

// file_owner,owner,admin can only see what files are shared with file_owner
router.get("/:userId", authorizeDataAccess, filesSharedWithMe);

// file_owner,owner,admin can only see users who access this file
router.get("/:userId/:fileId", authorizeDataAccess, listUsersHavingTheFile);

// file_owner,owner can only share the file
router.post("/:userId/:fileId", authorizeDataAccess, shareFile);

// file_owner,owner can only revoke access of the file from other users
router.delete("/:userId/:fileId", authorizeDataAccess, revokeAccess);

export default router;
