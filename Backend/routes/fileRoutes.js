import express from "express";
import fs from "fs/promises";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import filesDB from "../filesDB.json" with { type: "json" };
import dirsDB from "../dirsDB.json" with { type: "json" };
import ApiError from "../utils/apiError.js";
import validateId from "../middlewares/validateIdMiddleware.js";

const router = express.Router();

router.param("fileId", validateId);

// serving file contents
router.get("/:fileId", (req, res, next) => {
  const fileId = req.params.fileId;
  const file = filesDB.find((file) => file.id === fileId);
  const user = req.user;

  // find the parentDir in user's dirsDB
  const parentDir = file
    ? dirsDB.find((dir) => dir.user === user.id && file.parentDir === dir.id)
    : null;

  if (!parentDir || !file) return next(new ApiError(404, "File not found!"));

  const fullpath = path.join(process.cwd(), "storage/", fileId + file.extname);

  console.log(fullpath);

  if (req.query.action === "download") {
    return res.download(fullpath, file.name);
  }

  res.sendFile(fullpath, (err) => {
    if (err && !res.headersSent)
      return next(new ApiError(500, `File Sending failed: ${err.message}`));
  });
});

// file upload
router.post("/", async (req, res, next) => {
  let parentDirId = req.body.parentDirId;
  const user = req.user;

  // get the parentDir or assign the root directory
  const parentDir = parentDirId
    ? dirsDB.find((dir) => dir.user === user.id && dir.id === parentDirId)
    : dirsDB.find((dir) => dir.user === user.id && dir.parentDir === null);

  if (!parentDir)
    throw new ApiError(404, "Given Parent Directory doesn't exist!");

  parentDirId = parentDir.id;

  for (const file of req.files) {
    const [fileId, _] = file.filename.split(".");
    const fileExt = path.extname(file.filename);

    // add entry in parent's files list
    parentDir.files.push(fileId);

    // add entry in filesDB
    filesDB.push({
      id: fileId,
      name: file.originalname,
      size: file.size,
      parentDir: parentDirId,
      extname: fileExt,
    });
  }

  // update the filesDB file
  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  );

  // update the dirsDB file
  await writeFile(
    path.join(process.cwd(), "dirsDB.json"),
    JSON.stringify(dirsDB),
  );

  res.status(201).json({ message: "Got the File!" });
});

// file renaming
router.patch("/:fileId", async (req, res, next) => {
  if (!req.body.newFilename)
    return next(new ApiError(400, "new filename required!"));

  const parentPath = path.join(process.cwd(), "storage");
  const fileId = req.params.fileId;
  const file = filesDB.find((file) => file.id === fileId);
  const old_ext = file.extname;
  const user = req.user;

  // find the parentDir in user's dirsDB
  const parentDir = file
    ? dirsDB.find((dir) => dir.user === user.id && file.parentDir === dir.id)
    : null;

  if (!parentDir || !file) return next(new ApiError(404, "File not found!"));

  // updating name and extension
  file.name = req.body.newFilename;
  file.extname = path.extname(file.name);

  // renaming when extension differs
  if (old_ext != file.extname)
    await fs.rename(
      path.join(parentPath, file.id + old_ext),
      path.join(parentPath, file.id + file.extname),
    );

  // commit the changes to filesDB
  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  );

  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/:fileId", async (req, res, next) => {
  const fileId = req.params.fileId;
  const file = filesDB.find((file) => file.id === fileId);
  const user = req.user;

  // find the parentDir in user's dirsDB
  const parentDir = file
    ? dirsDB.find((dir) => dir.user === user.id && file.parentDir === dir.id)
    : null;

  if (!parentDir || !file) return next(new ApiError(404, "File not found!"));

  const fullpath = path.join(process.cwd(), "storage/", file.id + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true });

  // remove from filesDB array
  const file_ind = filesDB.findIndex((file) => file.id === fileId);
  filesDB.splice(file_ind, 1);

  // remove from parent directory's files list
  parentDir.files = parentDir.files.filter((fileId) => fileId !== file.id);

  // update the filesDB file
  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  );

  // update the dirsDB file
  await writeFile(
    path.join(process.cwd(), "dirsDB.json"),
    JSON.stringify(dirsDB),
  );

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
