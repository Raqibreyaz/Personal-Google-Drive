import express from "express";
import validateId from "../middlewares/validateIdMiddleware.js";
import {
  deleteFile,
  getFileContents,
  renameFile,
  saveFile,
  setAllowAnyone,
} from "../controllers/fileControllers.js";
import authorizeDataAccess from "../middlewares/authorizeDataAccess.js";
import checkFileAccessAllowed from "../middlewares/checkFileAccessAllowed.js";

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);

/* for [data_owner, viewer, editor] only */
router.post("/", saveFile);

router.get("/:fileId", checkFileAccessAllowed, getFileContents);

router.patch("/rename/:fileId", checkFileAccessAllowed, renameFile);

router.patch("/set-access/:fileId", checkFileAccessAllowed, setAllowAnyone);

router.delete("/:fileId", checkFileAccessAllowed, deleteFile);

router.post("/:userId", checkFileAccessAllowed, saveFile);

/* for [data_owner, app_owner, admin] only */
router.post("/:userId", authorizeDataAccess, saveFile);

router.get("/:userId/:fileId", authorizeDataAccess, getFileContents);

router.patch("/rename/:userId/:fileId", authorizeDataAccess, renameFile);

router.patch(
  "/set-access/:userId/:fileId",
  authorizeDataAccess,
  setAllowAnyone,
);

router.delete("/:userId/:fileId", authorizeDataAccess, deleteFile);

router.post("/:userId/:userId", authorizeDataAccess, saveFile);

export default router;
