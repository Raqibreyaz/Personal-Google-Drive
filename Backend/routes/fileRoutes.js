import express from "express";
import { ObjectId, Long } from "mongodb";
import fs from "fs/promises";
import path from "node:path";
import ApiError from "../utils/apiError.js";
import validateId from "../middlewares/validateIdMiddleware.js";

const router = express.Router();

router.param("fileId", validateId);

// serving file contents
router.get("/:fileId", async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const fileId = req.params.fileId;
  const filesCollection = db.collection("files");

  const file = await filesCollection.findOne({
    _id: new ObjectId(fileId),
    user: user._id,
  });
  if (!file) return next(new ApiError(404, "File not found!"));

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
    ? await directoryCollection.findOne({
        user: user._id,
        _id: new ObjectId(parentDirId),
      })
    : await directoryCollection.findOne({
        _id: user.storageDir,
      });

  if (!parentDir)
    throw new ApiError(404, "Given Parent Directory doesn't exist!");

  parentDirId = parentDir._id;

  // req.on("aborted", () => {
  //   fs.unlink(req.file  .path);
  //   res.status(400).json({ error: "Couldn't upload file" });
  // });

  // req.on("end", async () => {
  const file = req.file;
  const [fileId, _] = file.filename.split(".");
  const fileExt = path.extname(file.filename);

  // add entry in filesCollection
  await filesCollection.insertOne({
    _id: new ObjectId(fileId),
    name: file.originalname,
    size: Long.fromNumber(file.size), //for handling large file sizes
    parentDir: parentDirId,
    extname: fileExt,
    user: user._id,
  });

  res.status(201).json({ message: "Got the File!" });
  // });
});

// file renaming
router.patch("/:fileId", async (req, res, next) => {
  if (!req.body.newFilename)
    return next(new ApiError(400, "new filename required!"));

  const db = req.db;
  const user = req.user;
  const fileId = req.params.fileId;
  const newFilename = req.body.newFilename;
  const newExt = path.extname(newFilename);
  const parentPath = path.join(process.cwd(), "storage");
  const filesCollection = db.collection("files");

  const file = await filesCollection.findOne({
    _id: new ObjectId(fileId),
    user: user._id,
  });
  const oldExt = file.extname;

  if (!file) return next(new ApiError(404, "File not found!"));

  // renaming when extension differs
  if (oldExt != newExt)
    await fs.rename(
      path.join(parentPath, fileId + oldExt),
      path.join(parentPath, fileId + newExt),
    );

  // updating filename in DB
  await filesCollection.updateOne(
    { _id: file._id },
    { $set: { name: newFilename } },
  );

  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/:fileId", async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const fileId = req.params.fileId;
  const filesCollection = db.collection("files");

  const file = await filesCollection.findOne({
    _id: new ObjectId(fileId),
    user: user._id,
  });
  if (!file) return next(new ApiError(404, "File not found!"));

  // remove file from storage
  const fullpath = path.join(process.cwd(), "storage/", fileId + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true });

  // remove from filesCollection
  await filesCollection.deleteOne({ _id: file._id });

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
