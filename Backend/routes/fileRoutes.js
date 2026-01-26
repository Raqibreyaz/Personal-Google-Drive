import express from "express";
import { ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import filesCollection from "../filesCollection.json" with { type: "json" };
import directoryCollection from "../directoryCollection.json" with { type: "json" };
import ApiError from "../utils/apiError.js";
// import validateId from "../middlewares/validateIdMiddleware.js";

const router = express.Router();

// router.param("fileId", validateId);

// serving file contents
router.get("/:fileId", async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const fileId = req.params.fileId;
  const directoryCollection = db.collection("directories");
  const filesCollection = db.collection("files");

  const file = await filesCollection.findOne({ _id: fileId });

  // find the parentDir in user's directoryCollection
  const parentDir = file
    ? directoryCollection.findOne({ user: user._id, _id: file.parentDir })
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
  const db = req.db;
  const user = req.user;
  let parentDirId = req.body.parentDirId;
  const filesCollection = db.collection("files");
  const directoryCollection = db.collection("directories");

  // get the parentDir or assign the root directory
  const parentDir = parentDirId
    ? directoryCollection.findOne({
        user: user._id,
        _id: new ObjectId(parentDirId),
      })
    : directoryCollection.findOne({
        user: user._id,
        parentDir: null,
      });

  if (!parentDir)
    throw new ApiError(404, "Given Parent Directory doesn't exist!");

  parentDirId = parentDir.id;

  for (const file of req.files) {
    const [fileId, _] = file.filename.split(".");
    const fileExt = path.extname(file.filename);

    // add entry in parent's files list
    await directoryCollection.updateOne(
      { _id: parentDirId },
      { $push: { files: fileId } },
    );

    // add entry in filesCollection
    await filesCollection.insertOne({
      name: file.originalname,
      size: file.size,
      parentDir: parentDirId,
      extname: fileExt,
    });
  }

  res.status(201).json({ message: "Got the File!" });
});

// file renaming
router.patch("/:fileId", async (req, res, next) => {
  if (!req.body.newFilename)
    return next(new ApiError(400, "new filename required!"));

  const parentPath = path.join(process.cwd(), "storage");
  const fileId = req.params.fileId;
  const file = filesCollection.find((file) => file.id === fileId);
  const old_ext = file.extname;
  const user = req.user;

  // find the parentDir in user's directoryCollection
  const parentDir = file
    ? directoryCollection.find(
        (dir) => dir.user === user.id && file.parentDir === dir.id,
      )
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

  // commit the changes to filesCollection
  await writeFile(
    path.join(process.cwd(), "filesCollection.json"),
    JSON.stringify(filesCollection),
  );

  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/:fileId", async (req, res, next) => {
  const fileId = req.params.fileId;
  const file = filesCollection.find((file) => file.id === fileId);
  const user = req.user;

  // find the parentDir in user's directoryCollection
  const parentDir = file
    ? directoryCollection.find(
        (dir) => dir.user === user.id && file.parentDir === dir.id,
      )
    : null;

  if (!parentDir || !file) return next(new ApiError(404, "File not found!"));

  const fullpath = path.join(process.cwd(), "storage/", file.id + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true });

  // remove from filesCollection array
  const file_ind = filesCollection.findIndex((file) => file.id === fileId);
  filesCollection.splice(file_ind, 1);

  // remove from parent directory's files list
  parentDir.files = parentDir.files.filter((fileId) => fileId !== file.id);

  // update the filesCollection file
  await writeFile(
    path.join(process.cwd(), "filesCollection.json"),
    JSON.stringify(filesCollection),
  );

  // update the directoryCollection file
  await writeFile(
    path.join(process.cwd(), "directoryCollection.json"),
    JSON.stringify(directoryCollection),
  );

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
