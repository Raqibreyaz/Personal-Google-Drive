import express from "express";
import fs, { readdir } from "fs/promises";
import path from "node:path";

const router = express.Router();

// serving directory contents
router.get("/{*path}", async (req, res) => {
  const dirpath = req.params.path ?? [];

  const full_dir_path = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...dirpath),
  );

  console.log(full_dir_path);

  const files = await readdir(full_dir_path, { withFileTypes: true }).then(
    (dirents) =>
      dirents
        .filter((dirent) => dirent.isDirectory() || dirent.isFile())
        .map((dirent) => ({
          is_directory: dirent.isDirectory(),
          name: dirent.name,
          parent_path: dirent.parentPath,
        })),
  );
  res.header("Content-Type", "application/json");
  return res.status(200).json(files);
});

// creating directory
router.post("/*path", async (req, res) => {
  const dirpath = req.params.path;
  const full_dir_path = path.join(
    process.cwd(),
    "storage/",
    path.join("/", ...dirpath),
  );

  console.log(full_dir_path);

  await fs.mkdir(full_dir_path);

  res.json({ message: "Directory Created" });
});

export default router;
