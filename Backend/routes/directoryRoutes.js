import express from "express";
import crypto from "node:crypto";
import dirsDB from "../dirsDB.json" with { type: "json" };
import filesDB from "../filesDB.json" with { type: "json" };
import { writeFile } from "node:fs/promises";
import { deleteDirRecursively } from "../utils/recursiveDirectoryRemover.js";
import ApiError from "../utils/apiError.js";

const router = express.Router();

// serving directory contents
router.get("/{:dir_id}", async (req, res, next) => {
  const { dir_id } = req.params;
  const dir = dir_id ? dirsDB.find((dir) => dir.id === dir_id) : dirsDB[0];

  if (!dir) {
    return next(new ApiError(404, "Directory not found!"));
  }

  const files = filesDB.filter((file) => dir.files.includes(file.id));

  const directories = dirsDB.filter((sub_dir) =>
    dir.directories.includes(sub_dir.id),
  );

  console.log(files);
  console.log(directories);

  res.status(200).json({ ...dir, files, directories });
});

// creating directory
router.post("/:dirname", async (req, res, next) => {
  const dirname = req.params.dirname;
  const dir_id = crypto.randomUUID();
  const parent_dir_id = req.headers.parent_dir_id || dirsDB[0].id;

  const parentDir = dirsDB.find((dir) => dir.id === parent_dir_id);
  if (!parentDir)
    return next(new ApiError(404, "Given Parent directory doesn't exist!"));

  // add entry of this directory in dirsDB array
  dirsDB.push({
    id: dir_id,
    name: dirname,
    parentDir: parent_dir_id,
    directories: [],
    files: [],
  });

  // add entry of this directory to its parent also
  parentDir.directories.push(dir_id);

  // update dirsDB file
  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB)).catch(
    (err) => {
      throw new ApiError(500, err.message);
    },
  );

  res.status(201).json({ message: "Directory created!" });
});

// changing directory name
router.patch("/:dir_id", async (req, res, next) => {
  if (!req.body.new_dirname)
    return next(new ApiError(400, "New Dirname required!"));

  const dir_id = req.params.dir_id;

  const new_dirname = req.body.new_dirname;

  const dirIndex = dirsDB.findIndex((dir) => dir.id === dir_id);
  if (dirIndex === -1) return next(new ApiError(404, "Directory not found!"));

  dirsDB[dirIndex].name = new_dirname;

  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));

  res.status(200).json({ message: "Directory name updated!" });
});

// deleting directory
router.delete("/:dir_id", async (req, res, next) => {
  const dir_id = req.params.dir_id;
  const curr_dir = dirsDB.find((dir) => dir.id === dir_id);

  if (!curr_dir) return next(new ApiError(404, "Directory doesn't exist!"));

  // remove all the files and sub-dirs of sub-dir
  // remove all the files and sub directories of the directory
  await deleteDirRecursively(dir_id, dirsDB, filesDB);

  // remove entry of curr dir from its parent
  dirsDB.forEach((dir) => {
    if (dir.id === curr_dir.parentDir)
      dir.directories = dir.directories.filter((d_id) => d_id != dir_id);
  });

  // update the dirsDB and filesDB file
  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));
  await writeFile(`${process.cwd()}/filesDB.json`, JSON.stringify(filesDB));

  res.json({ message: "Directory deleted!" });
});

export default router;
