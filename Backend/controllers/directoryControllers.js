import { ObjectId } from "mongodb";
import ApiError from "../utils/apiError.js";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const getDirectoryContents = async (req, res, next) => {
  const userId = req.targetUserId;

  // find the directory in user's dirsDB or assign user's root directory
  const dir = req.directory
    ? req.directory
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
  const userId = req.targetUserId;
  const dirname = req.params.dirname;

  const parentDir = req.directory
    ? req.directory
    : await Directory.findOne({ user: userId, parentDir: null });

  if (!parentDir)
    throw new ApiError(404, "Given Parent directory doesn't exist!");

  // add entry of this directory
  await Directory.insertOne({
    name: dirname,
    parentDir: parentDir._id,
    user: userId,
  });

  res.status(201).json({ message: "Directory created!" });
};

export const updateDirectoryName = async (req, res, next) => {
  if (!req.body.newDirname) throw new ApiError(400, "New Dirname required!");

  const dirId = req.params.dirId;
  const newDirname = req.body.newDirname;

  // find & update the dir
  const updateRes = await Directory.updateOne(
    {
      _id: new ObjectId(dirId),
    },
    { $set: { name: newDirname } },
  );
  if (!updateRes.modifiedCount) throw new ApiError(404, "Directory not found!");

  res.status(200).json({ message: "Directory name updated!" });
};

export const deleteDirectory = async (req, res, next) => {
  const currDir = req.directory;
  if (!currDir) throw new ApiError(404, "Directory doesn't exist!");

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(currDir._id);

  res.json({ message: "Directory deleted!" });
};
