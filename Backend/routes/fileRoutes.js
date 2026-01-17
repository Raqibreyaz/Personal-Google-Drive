import express from "express";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "node:path";

const router = express.Router();

// serving file contents
router.get("/*path", (req, res) => {
  const filepath = req.params.path ?? [];

  const fullpath = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...filepath),
  );

  if (req.query.action === "download")
    res.header("Content-Disposition", `attachment;`);

  res.sendFile(fullpath);
});

// file upload
router.post("/*path", (req, res) => {
  const filepath = req.params.path;
  const fullpath = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...filepath),
  );
  const write_stream = createWriteStream(fullpath);

  req.pipe(write_stream);

  res.status(201).json({ message: "Got the File!" });
});

// file renaming
router.patch("/*path", async (req, res) => {
  if (!req.body.new_filename)
    return res.status(400).json({ message: "new filename required!" });

  let filepath = req.params.path ?? [];
  console.log(filepath);

  const old_filename = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...filepath),
  );
  const new_filename = path.join(
    process.cwd(),
    "storage",
    path.join("/", ...filepath.slice(0, -1)),
    path.join("/", req.body.new_filename),
  );

  await fs.rename(old_filename, new_filename);
  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
router.delete("/*path", async (req, res) => {
  const filepath = req.params.path ?? [];
  const fullpath = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...filepath),
  );
  await fs.rm(fullpath, { recursive: true, force: true });

  res.status(200).json({ message: "File Deleted!" });
});

export default router;
