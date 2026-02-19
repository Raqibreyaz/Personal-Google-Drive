import { ObjectId } from "mongodb";
import ApiError from "../utils/apiError.js";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const getDirectoryContents = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;

  // find the directory in user's dirsDB or assign user's root directory
  const dir = dirId
    ? await Directory.findOne({ user: userId, _id: dirId }).lean()
    : await Directory.findOne({ user: userId, parentDir: null }).lean();
  if (!dir) throw new ApiError(404, "Directory not found!");

  // get all files where parent is 'dir'
  const files = await File.find({ parentDir: dir._id }).lean();

  // get all directories in 'dir'(of user only)
  const directories = await Directory.find({
    parentDir: dir._id,
  }).lean();

  console.log(files);
  console.log(directories);

  res.status(200).json({ ...dir, files, directories });
};

export const createDirectory = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!");

  const userId = req.targetUserId || req.session.user._id.toString();
  const dirname = req.params.dirname;
  const parentDirId = req.body.parentDirId;

  const parentDir = parentDirId
    ? await Directory.findOne({ user: userId, _id: parentDirId }).lean()
    : await Directory.findOne({ user: userId, parentDir: null }).lean();
  if (!parentDir)
    throw new ApiError(404, "Given Parent directory doesn't exist!");

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
  if (!req.body) throw new ApiError(400, "No data received!");

  if (!req.body.newDirname) throw new ApiError(400, "New Dirname required!");

  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;
  const newDirname = req.body.newDirname;

  const directory = await Directory.findOne({ _id: dirId, user: userId });
  if (!directory) throw new ApiError(404, "Directory doesn't exist!");

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
    );

  await directory.updateOne({ $set: { name: newDirname } });

  res.status(200).json({ message: "Directory name updated!" });
};

export const deleteDirectory = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const dirId = req.params.dirId;

  const currDir = await Directory.findOne({ _id: dirId, user: userId }).lean();
  if (!currDir) throw new ApiError(404, "Directory doesn't exist!");

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(currDir._id);

  res.json({ message: "Directory deleted!" });
};
