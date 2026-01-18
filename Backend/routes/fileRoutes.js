import express from "express";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "node:path";
import crypto from "crypto";
import { stat, writeFile } from "node:fs/promises";
import filesDB from "../filesDB.json" with { type: "json" };
import dirsDB from "../dirsDB.json" with { type: "json" };

const router = express.Router();

// serving file contents
router.get("/:file_id", (req, res) => {
  const file_id = req.params.file_id;

  const file = filesDB.find((file) => file.id === file_id);

  if (!file) return res.status(404).json({ message: "file not found!" });

  const fullpath = path.join(process.cwd(), "storage/", file_id + file.extname);

  if (req.query.action === "download")
    res.header("Content-Disposition", `attachment;`);

  res.sendFile(fullpath);
});

// file upload
router.post("/:filename", async (req, res) => {
  const filepath = req.params.filename;
  const parent_dir_id = req.headers.parent_dir_id ?? dirsDB[0].id;
  const file_id = crypto.randomUUID();
  const file_ext = path.extname(filepath);

  // create a file in the storage directory
  // assign name as the unique id
  const fullpath = path.join(process.cwd(), "storage/", file_id + file_ext);

  // store the contents of the file
  const write_stream = createWriteStream(fullpath);
  req.pipe(write_stream);

  req.on("end", async () => {
    const { size } = await stat(fullpath);

    // add entry in filesDB
    filesDB.push({
      id: file_id,
      name: filepath,
      size,
      parentDir: parent_dir_id,
      extname: file_ext,
    });

    // add entry in dirsDB
    dirsDB.forEach((dir) => {
      if (dir.id === parent_dir_id) dir.files.push(file_id);
    });

    // update the filesDB file
    await writeFile(
      path.join(process.cwd(), "filesDB.json"),
      JSON.stringify(filesDB),
    );
    
    // update the dirsDB file
    await writeFile(
      path.join(process.cwd(), "dirsDB.json"),
      JSON.stringify(dirsDB),
    );
    
    res.status(201).json({ message: "Got the File!" });
  });

  req.on("error", (err) => res.status(400).json({ message: err.message }));
});

// file renaming
router.patch("/:file_id", async (req, res) => {
  if (!req.body.new_filename)
    return res.status(400).json({ message: "new filename required!" });

  const file_id = req.params.file_id;

  const file = filesDB.find((file) => file.id === file_id);
  if (!file) return res.status(404).json({ message: "file not found" });

  file.name = req.body.new_filename;

  await writeFile(
    path.join(process.cwd(), "filesDB.json"),
    JSON.stringify(filesDB),
  );

  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/:file_id", async (req, res) => {
  const file_id = req.params.file_id;

  // find the file
  const file = filesDB.find((file) => file.id === file_id);
  if (!file) return res.status(404).json({ message: "file not found" });

  const fullpath = path.join(process.cwd(), "storage/", file.id + file.extname);
  await fs.rm(fullpath, { recursive: true, force: true });

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
  );

  // update the dirsDB file
  await writeFile(
    path.join(process.cwd(), "dirsDB.json"),
    JSON.stringify(dirsDB),
  );

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
