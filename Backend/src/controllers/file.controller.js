import mongoose from "mongoose";
import dataSanitizer from "../helpers/dataSanitizer.js";
import path from "node:path";
import { ObjectId } from "mongodb";
import ApiError from "../helpers/apiError.js";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";
import File from "../models/file.model.js";
import FileShare from "../models/fileShare.model.js";
import updateParentSize from "../helpers/updateParentSize.js";
import {
  FILE_NOT_FOUND,
  FILE_MISSING_STORAGE,
  DUPLICATE_FILE,
  FILE_SEND_FAILED,
  DIR_NOT_FOUND,
} from "../constants/errorCodes.js";
import {
  createObjectPresignedUrl,
  deleteObject,
  getObjectPresignedUrl,
  getObjectSize,
  renameObject,
} from "../services/aws.service.js";
import {
  SAFE_INLINE_TYPES,
  RENDER_AS_TEXT,
} from "../constants/fileRenderConstants.js";

export const getFileContents = async (req, res, next) => {
  const fileId = req.params.fileId;

  const file = req.fileDoc ? req.fileDoc : await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!", FILE_NOT_FOUND);

  // prevent mime sniffing when content-type is not provided
  res.set("X-Content-Type-Options", "nosniff");

  let renderAsText = false;
  let toDownload = req.query.action === "download";

  if (!toDownload) {
    const ext = file.extname.toLowerCase();
    if (SAFE_INLINE_TYPES.has(ext)) {
    } else if (RENDER_AS_TEXT.has(ext)) {
      renderAsText = true;
    } else {
      // unknown/binary types — force download
      toDownload = true;
    }
  }

  const fileUrl = await getObjectPresignedUrl(
    fileId + file.extname,
    file.name,
    toDownload,
    renderAsText,
  );

  res.redirect(302, fileUrl);
};

export const initiateFileUpload = async (req, res, next) => {
  const MAX_FILE_SIZE_LIMIT = parseInt(
    process.env.MAX_FILE_SIZE_LIMIT || 50 * 1024 * 1024,
  );

  const userId = req.targetUserId || req.session.user._id.toString();
  const parentDirId = req.params.parentDirId;
  const fileSize = req.body.fileSize;
  const fileType = req.body.fileType;
  const fileName = req.body.fileName;

  const user = await User.findById(userId).lean();
  const rootDir = await Directory.findById(user.storageDir).lean();

  const usedStorageInBytes = rootDir?.size || 0;
  const maxStorageInBytes = user.maxStorageInBytes;
  const availableSpace = Math.max(0, maxStorageInBytes - usedStorageInBytes);
  const effectiveMaxLimit = Math.min(MAX_FILE_SIZE_LIMIT, availableSpace);

  if (effectiveMaxLimit < fileSize) {
    throw new ApiError(413, "File Too Large!", "FILE_SIZE_LIMIT_EXCEEDED");
  }
  if (dataSanitizer.sanitize(fileName) !== fileName) {
    throw new ApiError(400, "Invalid filename!");
  }
  if (dataSanitizer.sanitize(fileType) !== fileType) {
    throw new ApiError(400, "Invalid Filetype!");
  }

  const fileId = new ObjectId();
  const fileExt = path.extname(fileName);

  // get the parentDir or assign the root directory
  const parentDir = parentDirId
    ? await Directory.findOne({ _id: parentDirId, user: userId }).lean()
    : rootDir;
  if (!parentDir)
    throw new ApiError(
      404,
      "Given Parent Directory doesn't exist!",
      DIR_NOT_FOUND,
    );

  // check if a file with that name already exists in that directory
  const fileAlreadyExist = !!(await File.exists({
    parentDir: parentDir._id,
    name: fileName,
  }).lean());
  if (fileAlreadyExist) {
    throw new ApiError(
      400,
      "A file with this name already exist in this directory",
      DUPLICATE_FILE,
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // add entry in File
    await File.insertOne(
      {
        _id: fileId,
        name: fileName,
        size: fileSize,
        parentDir: parentDir._id,
        extname: fileExt,
        isUploading: true,
        user: userId,
      },
      { session },
    );
    const signedUrl = await createObjectPresignedUrl(
      fileId + fileExt,
      fileSize,
      fileType,
    );

    await session.commitTransaction();
    res
      .status(201)
      .json({ message: "Got the File Metadata!", fileId, signedUrl });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};

export const completeFileUpload = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const fileId = req.params.fileId;

  const file = await File.findOne({ _id: fileId, user: userId });

  // file must exist and not been uploaded
  if (!file) throw new ApiError(404, "File not found!");
  if (!file.isUploading) throw new ApiError(400, "File was already uploaded!");

  // checking if the uploaded file's size is the expected size
  const uploadedSize = await getObjectSize(file._id.toString() + file.extname);
  if (uploadedSize !== file.size) {
    await File.deleteOne({ _id: file._id });
    await deleteObject(file._id.toString() + file.extname);

    throw new ApiError(
      400,
      "You are not allowed to upload more than the Limit!",
    );
  }

  // mark the file as uploaded! & update it's ancestors size
  file.isUploading = false;
  await file.save();
  await updateParentSize(file.parentDir, file.size);

  res.status(201).json({ message: "File Upload Completed!" });
};

export const renameFile = async (req, res, next) => {
  const fileId = req.params.fileId;
  const newFilename = req.body.newFilename;
  const newExt = path.extname(newFilename);

  const file = req.fileDoc
    ? req.fileDoc
    : await File.findById(req.params.fileId).lean();
  if (!file) throw new ApiError(404, "File not found!", FILE_NOT_FOUND);
  const oldExt = file.extname;

  // check if a file with that name already exists in that directory
  const fileAlreadyExist = !!(await File.exists({
    parentDir: file.parentDir,
    name: newFilename,
  }).lean());
  if (fileAlreadyExist) {
    throw new ApiError(
      400,
      "A file with this name already exist in this directory",
      DUPLICATE_FILE,
    );
  }

  // updating filename in DB
  await File.findByIdAndUpdate(file._id, {
    $set: { name: newFilename, extname: newExt },
  });

  // renaming when extension differs
  if (oldExt != newExt) {
    try {
      await renameObject(fileId + oldExt, fileId + newExt);
    } catch (error) {
      // rollback changes
      await File.findByIdAndUpdate(file._id, {
        $set: { name: file.name, extname: oldExt },
      });
      throw error;
    }
  }

  res.status(200).json({ message: "File Renamed!" });
};

export const setAllowAnyone = async (req, res, next) => {
  const fileId = req.params.fileId;
  const permission = req.body?.permission;

  const result = await File.updateOne(
    { _id: fileId },
    { $set: { allowAnyoneAccess: permission ? permission : null } },
  );

  if (!result.modifiedCount)
    throw new ApiError(404, "file not found!", FILE_NOT_FOUND);

  res.status(200).json({ message: "File permissions saved successfully!" });
};

export const deleteFile = async (req, res, next) => {
  const fileId = req.params.fileId;

  const file = req.fileDoc ? req.fileDoc : await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!", FILE_NOT_FOUND);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // remove from File
    await FileShare.deleteMany({ file: file._id }, { session });
    await File.findByIdAndDelete(file._id, { session });
    await updateParentSize(file.parentDir, -file.size, session);

    // remove file from storage
    await deleteObject(fileId + file.extname);

    await session.commitTransaction();
    res.status(200).json({ message: "File Deleted!" });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
};
