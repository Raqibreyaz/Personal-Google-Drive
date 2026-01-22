import express from "express";
import crypto from "node:crypto";
import dirsDB from "../dirsDB.json" with { type: "json" };
import filesDB from "../filesDB.json" with { type: "json" };
import { writeFile } from "node:fs/promises";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import ApiError from "../utils/apiError.js";
import validateId from "../utils/validateIdMiddleware.js";

const router = express.Router();

router.param("dirId", validateId);

// serving directory contents
router.get("/{:dirId}", async (req, res, next) => {
  // find the directory in user's dirsDB or assign user's root directory
  const { dirId } = req.params;
  const user = req.user;
  const dir = dirId
    ? dirsDB.find((dir) => dir.user === user.id && dir.id === dirId)
    : dirsDB.find((dir) => dir.user === user.id && dir.parentDir === null);

  if (!dir) return next(new ApiError(404, "Directory not found!"));

  // get all files of 'dir'
  const files = filesDB.filter((file) => dir.files.includes(file.id));

  // get all directories in of 'dir'(of user only)
  const directories = dirsDB.filter(
    (subDir) => subDir.user === user.id && dir.directories.includes(subDir.id),
  );

  console.log(files);
  console.log(directories);

  res.status(200).json({ ...dir, files, directories });
});

// creating directory
router.post("/:dirname", async (req, res, next) => {
  const dirname = req.params.dirname;
  const dirId = crypto.randomUUID();
  let parentDirId = req.body.parentDirId;
  const user = req.user;

  // get the parentDir or assign the root directory
  const parentDir = parentDirId
    ? dirsDB.find((dir) => dir.user === user.id && dir.id === parentDirId)
    : dirsDB.find((dir) => dir.user === user.id && dir.parentDir === null);

  if (!parentDir)
    return next(new ApiError(404, "Given Parent directory doesn't exist!"));

  parentDirId = parentDir.id;

  // add entry of this directory in dirsDB array
  dirsDB.push({
    id: dirId,
    name: dirname,
    parentDir: parentDir.id,
    user: user.id,
    directories: [],
    files: [],
  });

  // add entry of this directory to its parent also
  parentDir.directories.push(dirId);

  // update dirsDB file
  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB)).catch(
    (err) => {
      throw new ApiError(500, err.message);
    },
  );

  res.status(201).json({ message: "Directory created!" });
});

// changing directory name
router.patch("/:dirId", async (req, res, next) => {
  if (!req.body.newDirname)
    return next(new ApiError(400, "New Dirname required!"));

  const user = req.user;

  // find the dir
  const dirId = req.params.dirId;
  const dir = dirsDB.find((dir) => dir.user === user.id && dir.id === dirId);
  if (!dir) return next(new ApiError(404, "Directory not found!"));

  const newDirname = req.body.newDirname;
  dir.name = newDirname;

  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));

  res.status(200).json({ message: "Directory name updated!" });
});

// deleting directory
router.delete("/:dirId", async (req, res, next) => {
  // get the given directory
  const dirId = req.params.dirId;
  const user = req.user;
  const currDir = dirsDB.find(
    (dir) => dir.user === user.id && dir.id === dirId,
  );
  if (!currDir) return next(new ApiError(404, "Directory doesn't exist!"));

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(dirId, dirsDB, filesDB);

  // remove entry of curr dir from its parent
  dirsDB.forEach((dir) => {
    if (dir.id === currDir.parentDir)
      dir.directories = dir.directories.filter((dId) => dId != dirId);
  });

  // update the dirsDB and filesDB file
  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));
  await writeFile(`${process.cwd()}/filesDB.json`, JSON.stringify(filesDB));

  res.json({ message: "Directory deleted!" });
});

export default router;
