import express from "express";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "node:path";
import crypto from "crypto";
import { stat, writeFile } from "node:fs/promises";
import filesDB from "../filesDB.json" with { type: "json" };
import dirsDB from "../dirsDB.json" with { type: "json" };
import ApiError from "../utils/apiError.js";

const router = express.Router();

// serving file contents
router.get("/:file_id", (req, res, next) => {
  const file_id = req.params.file_id;

  const file = filesDB.find((file) => file.id === file_id);

  if (!file) return next(new ApiError(404, "File not found!"));

  const fullpath = path.join(process.cwd(), "storage/", file_id + file.extname);

  console.log(fullpath);
  console.log(req.query);

  if (req.query.action === "download")
    res.header("Content-Disposition", `attachment; filename=${file.name}`);

  res.sendFile(fullpath, (err) => {
    if (err && !res.headersSent)
      return next(new ApiError(500, `File Sending failed: ${err.message}`));
  });
});

// file upload
router.post("/:filename", async (req, res, next) => {
  const filepath = req.params.filename;
  const parent_dir_id = req.headers.parent_dir_id || dirsDB[0].id;
  const file_id = crypto.randomUUID();
  const file_ext = path.extname(filepath);

  // create a file in the storage directory
  // assign unique id as the name
  const fullpath = path.join(process.cwd(), "storage/", file_id + file_ext);

  // store the contents of the file
  const write_stream = createWriteStream(fullpath);
  req.pipe(write_stream);

  req.on("end", async () => {
    const { size } = await stat(fullpath).catch((err) => {
      throw new ApiError(500, err.message);
    });

    // add entry in filesDB
    filesDB.push({
      id: file_id,
      name: filepath,
      size,
      parentDir: parent_dir_id,
      extname: file_ext,
    });

    const parentDir = dirsDB.find((dir) => dir.id === parent_dir_id);
    if (!parentDir)
      throw new ApiError(404, "Given parent directory doesn't exist!");

    // add entry in dirsDB
    parentDir.files.push(file_id);

    // update the filesDB file
    await writeFile(
      path.join(process.cwd(), "filesDB.json"),
      JSON.stringify(filesDB),
    ).catch((err) => {
      throw new ApiError(500, err.message);
    });

    // update the dirsDB file
    await writeFile(
      path.join(process.cwd(), "dirsDB.json"),
      JSON.stringify(dirsDB),
    ).catch((err) => {
      throw new ApiError(500, err.message);
    });

    res.status(201).json({ message: "Got the File!" });
  });

  req.on("error", (err) => next(new ApiError(400, err.message)));
});

// file renaming
router.patch("/:file_id", async (req, res, next) => {
  if (!req.body.new_filename)
    return next(new ApiError(400, "new filename required!"));

  const file_id = req.params.file_id;
  const parentPath = path.join(process.cwd(), "storage");
  const file = filesDB.find((file) => file.id === file_id);
  const old_ext = file.extname;
  if (!file) return next(new ApiError(404, "File not found!"));

  // updating name and extension
  file.name = req.body.new_filename;
  file.extname = path.extname(file.name);

  // renaming when extension differs
  if (old_ext != file.extname)
    await fs
      .rename(
        path.join(parentPath, file.id + old_ext),
        path.join(parentPath, file.id + file.extname),
      )
      .catch((err) => {
        throw new ApiError(500, err.message);
      });

  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  ).catch((err) => {
    throw new ApiError(500, err.message);
  });

  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/:file_id", async (req, res, next) => {
  const file_id = req.params.file_id;

  // find the file
  const file = filesDB.find((file) => file.id === file_id);
  if (!file) return next(new ApiError(404, "file not found"));

  const fullpath = path.join(process.cwd(), "storage/", file.id + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true }).catch((err) => {
    throw new ApiError(500, err.message);
  });

  // remove from filesDB array
  const file_ind = filesDB.findIndex((file) => file.id === file_id);
  filesDB.splice(file_ind, 1);

  // remove from dirsDB array
  const parent_dir = dirsDB.find((dir) => dir.id === file.parentDir);
  parent_dir.files = parent_dir.files.filter((file_id) => file_id !== file.id);

  // update the filesDB file
  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  ).catch((err) => {
    throw new ApiError(500, err.message);
  });

  // update the dirsDB file
  await writeFile(
    path.join(process.cwd(), "dirsDB.json"),
    JSON.stringify(dirsDB),
  ).catch((err) => {
    throw new ApiError(500, err.message);
  });

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
