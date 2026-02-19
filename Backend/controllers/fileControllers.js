import { ObjectId } from "mongodb";
import fs from "fs/promises";
import path from "node:path";
import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";
import File from "../models/fileModel.js";
import Directory from "../models/directoryModel.js";

export const getFileContents = async (req, res, next) => {
  const fileId = req.params.fileId;

  const file = req.fileDoc ? req.fileDoc : await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  const fullpath = path.join(process.cwd(), "storage/", fileId + file.extname);

  if (req.query.action === "download") {
    return res.download(fullpath, file.name);
  }

  res.sendFile(fullpath, (err) => {
    if (err && !res.headersSent)
      throw new ApiError(500, `File Sending failed: ${err.message}`);
  });
};

export const saveFile = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!");

  const userId = req.targetUserId || req.session.user._id.toString();
  const parentDirId = req.body.parentDirId;

  // get the parentDir or assign the root directory
  const parentDir = parentDirId
    ? await Directory.findOne({ _id: parentDirId, user: userId }).lean()
    : await Directory.findOne({
        user: userId,
        parentDir: null,
      }).lean();

  if (!parentDir)
    throw new ApiError(404, "Given Parent Directory doesn't exist!");

  const file = req.file;
  const [fileId, _] = file.filename.split(".");
  const fileExt = path.extname(file.filename);

  // check if a file with that name already exists in that directory
  const fileAlreadyExist = !!(await File.exists({
    parentDir: parentDir._id,
    name: file.originalname,
  }).lean());
  if (fileAlreadyExist) {
    await fs.rm(`storage/${file.filename}`);
    throw new ApiError(
      400,
      "A file with this name already exist in this directory",
    );
  }

  // add entry in File
  await File.insertOne({
    _id: new ObjectId(fileId),
    name: file.originalname,
    size: file.size, //for handling large file sizes
    parentDir: parentDir._id,
    extname: fileExt,
    user: userId,
  });

  res.status(201).json({ message: "Got the File!" });
};

export const renameFile = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!");

  if (!req.body.newFilename) throw new ApiError(400, "new filename required!");

  const fileId = req.params.fileId;
  const newFilename = req.body.newFilename;
  const newExt = path.extname(newFilename);
  const parentPath = path.join(process.cwd(), "storage");

  const file = req.fileDoc
    ? req.fileDoc
    : await File.findById(req.params.fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");
  const oldExt = file.extname;

  // renaming when extension differs
  if (oldExt != newExt)
    await fs.rename(
      path.join(parentPath, fileId + oldExt),
      path.join(parentPath, fileId + newExt),
    );

  // updating filename in DB
  await File.findByIdAndUpdate(file._id, { $set: { name: newFilename } });

  res.status(200).json({ message: "File Renamed!" });
};

export const setAllowAnyone = async (req, res, next) => {
  const fileId = req.params.fileId;
  const permission = req.body?.permission;

  const result = await File.updateOne(
    { _id: fileId },
    { $set: { allowAnyoneAccess: permission ? permission : null } },
  );

  if (!result.modifiedCount) throw new ApiError(404, "file not found!");

  res.status(200).json({ message: "File permissions saved successfully!" });
};

export const deleteFile = async (req, res, next) => {
  const fileId = req.params.fileId;

  const file = req.fileDoc
    ? req.fileDoc
    : await File.findById(req.params.fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  // remove file from storage
  const fullpath = path.join(process.cwd(), "storage/", fileId + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true });

  // remove from File
  await File.findByIdAndDelete(file._id);

  res.status(200).json({ message: "File Deleted!" });
};
