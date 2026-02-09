import { ObjectId } from "mongodb";
import ApiError from "../utils/apiError.js";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import Directory from "../models/directoryModel.js";
import File from '../models/fileModel.js'

export const getDirectoryContents = async (req, res, next) => {
  const { dirId } = req.params;
  const {user} = req.session

  // find the directory in user's dirsDB or assign user's root directory
  const dir = dirId
    ? await Directory.findOne({
        _id: new ObjectId(dirId),
        user: user._id,
      })
    : await Directory.findOne({ user: user._id, parentDir: null });

  if (!dir) throw new ApiError(404, "Directory not found!");

  // get all files where parent is 'dir'
  const files = await File.find({ parentDir: dir._id });

  // get all directories in 'dir'(of user only)
  const directories = await Directory
    .find({
      user: user._id,
      parentDir: dir._id,
    })

  console.log(files);
  console.log(directories);

  res.status(200).json({ ...dir, files, directories });
};

export const createDirectory = async (req, res, next) => {
  const {user} = req.session
  const dirname = req.params.dirname;
  let parentDirId = req.body.parentDirId;

  const parentDir = parentDirId
    ? await Directory.findOne({
        _id: new ObjectId(parentDirId),
        user: user._id,
      })
    : await Directory.findOne({ user: user._id, parentDir: null });

  if (!parentDir)
    throw new ApiError(404, "Given Parent directory doesn't exist!");

  parentDirId = parentDir._id;

  // add entry of this directory
  await Directory.insertOne({
    name: dirname,
    parentDir: parentDir._id,
    user: user._id,
  });

  res.status(201).json({ message: "Directory created!" });
};

export const updateDirectoryName = async (req, res, next) => {
  if (!req.body.newDirname) throw new ApiError(400, "New Dirname required!");

  const {user} = req.session
  const dirId = req.params.dirId;
  const newDirname = req.body.newDirname;

  // find & update the dir
  const updateRes = await Directory.updateOne(
    {
      _id: new ObjectId(dirId),
      user: user._id,
    },
    { $set: { name: newDirname } },
  );
  if (!updateRes) throw new ApiError(404, "Directory not found!");

  res.status(200).json({ message: "Directory name updated!" });
};

export const deleteDirectory = async (req, res, next) => {
  const {user} = req.session
  const dirId = req.params.dirId;

  const currDir = await Directory.findOne({
    _id: new ObjectId(dirId),
    user: user._id,
  });
  if (!currDir) throw new ApiError(404, "Directory doesn't exist!");

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(currDir._id);

  res.json({ message: "Directory deleted!" });
};
