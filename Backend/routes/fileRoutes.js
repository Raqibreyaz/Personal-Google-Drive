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

const router = express.Router();

router.param("fileId", validateId);
router.param("userId", validateId);

router.post("/", authorizeDataAccess, saveFile);

router.get("/:fileId", authorizeDataAccess, getFileContents);

router.patch("/rename/:fileId", authorizeDataAccess, renameFile);

router.patch("/set-access/:fileId", authorizeDataAccess, setAllowAnyone);

router.delete("/:fileId", authorizeDataAccess, deleteFile);

router.post("/:userId", authorizeDataAccess, saveFile);

export default router;
