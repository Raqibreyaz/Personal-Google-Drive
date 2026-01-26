import express from "express";
import { ObjectId } from "mongodb";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import ApiError from "../utils/apiError.js";
// import validateId from "../middlewares/validateIdMiddleware.js";

const router = express.Router();

// router.param("dirId", validateId);

// serving directory contents
router.get("/{:dirId}", async (req, res, next) => {
  const db = req.db;
  const directoryCollection = db.collection("directories");
  const filesCollection = db.collection("files");

  const { dirId } = req.params;
  const user = req.user;

  // find the directory in user's dirsDB or assign user's root directory
  const dir = dirId
    ? await directoryCollection.findOne({
        _id: new ObjectId(dirId),
        user: user._id,
      })
    : await directoryCollection.findOne({ user: user._id, parentDir: null });

  if (!dir) return next(new ApiError(404, "Directory not found!"));

  const fileIds = dir.files.map((fileId) => new ObjectId(fileId));
  const dirIds = dir.directories.map((subDirId) => new ObjectId(subDirId));

  // get all files of 'dir'
  const files = await filesCollection.find({ _id: { $in: fileIds } }).toArray();

  // get all directories in 'dir'(of user only)
  const directories = await directoryCollection
    .find({
      user: user._id,
      _id: { $in: dirIds },
    })
    .toArray();

  console.log(files);
  console.log(directories);

  res.status(200).json({ ...dir, files, directories });
});

// creating directory
router.post("/:dirname", async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const dirname = req.params.dirname;
  let parentDirId = req.body.parentDirId;
  const directoryCollection = db.collection("directories");

  const parentDir = parentDirId
    ? await directoryCollection.findOne({
        _id: new ObjectId(parentDirId),
        user: user._id,
      })
    : await directoryCollection.findOne({ user: user._id, parentDir: null });

  if (!parentDir)
    return next(new ApiError(404, "Given Parent directory doesn't exist!"));

  parentDirId = parentDir._id;

  // add entry of this directory
  const createdDir = await directoryCollection.insertOne({
    name: dirname,
    parentDir: parentDir._id,
    user: user._id,
    directories: [],
    files: [],
  });

  // add entry of this directory to its parent also
  await directoryCollection.updateOne(
    { _id: parentDir._id },
    { $push: { directories: createdDir.insertedId } },
  );

  res.status(201).json({ message: "Directory created!" });
});

// changing directory name
router.patch("/:dirId", async (req, res, next) => {
  if (!req.body.newDirname)
    return next(new ApiError(400, "New Dirname required!"));

  const db = req.db;
  const user = req.user;
  const dirId = req.params.dirId;
  const newDirname = req.body.newDirname;
  const directoryCollection = db.collection("directories");

  // find & update the dir
  const updateRes = await directoryCollection.updateOne(
    {
      _id: new ObjectId(dirId),
      user: user._id,
    },
    { $set: { name: newDirname } },
  );
  if (!updateRes) return next(new ApiError(404, "Directory not found!"));

  res.status(200).json({ message: "Directory name updated!" });
});

// deleting directory
router.delete("/:dirId", async (req, res, next) => {
  const db = req.db;
  const user = req.user;
  const dirId = req.params.dirId;
  const directoryCollection = db.collection("directories");
  const filesCollection = db.collection("files");

  const currDir = await directoryCollection.findOne({
    _id: new ObjectId(dirId),
    user: user._id,
  });
  if (!currDir) return next(new ApiError(404, "Directory doesn't exist!"));

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(currDir._id, directoryCollection, filesCollection);

  // pop out the curr directory's id from parent's list
  await directoryCollection.updateOne(
    { _id: currDir.parentDir },
    { $pull: { directories: currDir._id } },
  );

  res.json({ message: "Directory deleted!" });
});

export default router;
