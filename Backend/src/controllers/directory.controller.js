import ApiError from "../helpers/apiError.js";
import dataSanitizer from "../helpers/dataSanitizer.js";
import { deleteDirRecursively } from "../services/directory.service.js";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import {
  DIR_NOT_FOUND,
  INVALID_DIRNAME,
  DUPLICATE_DIR,
} from "../constants/errorCodes.js";

export const getDirectoryContents = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;

  // find the directory in user's dirsDB or assign user's root directory
  const dir = dirId
    ? await Directory.findOne({ user: userId, _id: dirId }).lean()
    : await Directory.findOne({ user: userId, parentDir: null }).lean();
  if (!dir) throw new ApiError(404, "Directory not found!", DIR_NOT_FOUND);

  // get all files where parent is 'dir'
  const files = await File.find({ parentDir: dir._id }).lean();

  // get all directories in 'dir'(of user only)
  const directories = await Directory.find({
    parentDir: dir._id,
  }).lean();

  res.status(200).json({ ...dir, files, directories });
};

export const createDirectory = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const initialDirname = req.body.dirname;
  const dirname = dataSanitizer.sanitize(req.body.dirname);
  const parentDirId = req.params.parentDirId;

  if (!dirname || initialDirname.length !== dirname.length)
    throw new ApiError(400, "Invalid Dirname!", INVALID_DIRNAME);

  const parentDir = parentDirId
    ? await Directory.findOne({ user: userId, _id: parentDirId }).lean()
    : await Directory.findOne({ user: userId, parentDir: null }).lean();
  if (!parentDir)
    throw new ApiError(404, "Given Parent directory doesn't exist!", DIR_NOT_FOUND);

  // check if a file with that name already exists in that directory
  const directoryAlreadyExist = !!(await Directory.exists({
    parentDir: parentDir._id,
    name: dirname,
    user: userId,
  }).lean());
  if (directoryAlreadyExist)
    throw new ApiError(
      400,
      "A directory with this name already exist in this level!",
      DUPLICATE_DIR,
    );

  // add entry of this directory
  await Directory.insertOne({
    name: dirname,
    parentDir: parentDir._id,
    user: userId,
  });

  res.status(201).json({ message: "Directory created!" });
};

export const updateDirectoryName = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;
  const initialDirname = req.body.dirname;
  const newDirname = dataSanitizer.sanitize(req.body.newDirname);

  if (!newDirname || initialDirname?.length !== newDirname?.length)
    throw new ApiError(400, "Invalid Dirname!", INVALID_DIRNAME);

  const directory = await Directory.findOne({ _id: dirId, user: userId });
  if (!directory) throw new ApiError(404, "Directory doesn't exist!", DIR_NOT_FOUND);

  // check if a directory with that name already exists in that directory
  const directoryAlreadyExist = !!(await Directory.exists({
    parentDir: directory.parentDir,
    name: newDirname,
    user: userId,
  }).lean());
  if (directoryAlreadyExist)
    throw new ApiError(
      400,
      "A directory with this name already exist in this level!",
      DUPLICATE_DIR,
    );

  await directory.updateOne({ $set: { name: newDirname } });

  res.status(200).json({ message: "Directory name updated!" });
};

export const deleteDirectory = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;

  const currDir = await Directory.findOne({ _id: dirId, user: userId }).lean();
  if (!currDir) throw new ApiError(404, "Directory doesn't exist!", DIR_NOT_FOUND);

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(currDir._id);

  res.json({ message: "Directory deleted!" });
};
