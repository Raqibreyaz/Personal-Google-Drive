import express from "express";
import crypto from "node:crypto";
import dirsDB from "../dirsDB.json" with { type: "json" };
import filesDB from "../filesDB.json" with { type: "json" };
import { writeFile } from "node:fs/promises";

const router = express.Router();

// serving directory contents
router.get("/{:dir_id}", async (req, res) => {
  const { dir_id } = req.params;

  const dir = dir_id ? dirsDB.find((dir) => dir.id === dir_id) : dirsDB[0];

  if (!dir) return res.json({ message: "directory not found!" });

  const files = filesDB.filter((file) => dir.files.includes(file.id));

  const directories = dirsDB.filter((sub_dir) =>
    dir.directories.includes(sub_dir.id),
  );

  res.json({ ...dir, files, directories });
});

// creating directory
router.post("/:dirname", async (req, res) => {
  const dirname = req.params.dirname;
  const dir_id = crypto.randomUUID();
  const parent_dir_id = req.headers.parent_dir_id;

  // add entry of this directory in dirsDB array
  dirsDB.push({
    id: dir_id,
    name: dirname,
    parentDir: parent_dir_id,
    directories: [],
    files: [],
  });

  // add entry of this directory to its parent also
  dirsDB.forEach((dir) => {
    if (dir.id === parent_dir_id) dir.directories.push(dir_id);
  });

  // update dirsDB file
  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));

  res.json({ message: "Directory created!" });
});

// changing directory name
router.patch("/:dir_id", async (req, res) => {
  if (!req.body.new_dirname)
    return res.json({ message: "New Dirname required!" });

  const dir_id = req.params.dir_id;

  const new_dirname = req.body.new_dirname;

  dirsDB.forEach((dir) => {
    if (dir.id === dir_id) dir.name = new_dirname;
  });

  await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));

  res.json({ message: "Directory name updated!" });
});

// deleting directory
router.delete("/:dir_id", async (req, res) => {
  // const dir_id = req.params.dir_id;
  // const curr_dir = dirsDB.find((dir) => dir.id === dir_id);

  // // remove entry of curr dir from its parent
  // dirsDB.forEach((dir) => {
  //   if (dir.id === curr_dir.parentDir)
  //     dir.directories = dir.directories.filter((d_id) => dir_id != dir_id);
  // });

  // // remove curr dir from dirsDB array
  // const dir_ind = dirsDB.findIndex((dir) => dir.id === dir_id);
  // dirsDB.splice(dir_ind, 1);

  // // remove all the files of the directory

  // // remove all the sub directories of the directory

  // // update the dirsDB file
  // await writeFile(`${process.cwd()}/dirsDB.json`, JSON.stringify(dirsDB));

  res.json({ message: "TODO!" });
});

export default router;
