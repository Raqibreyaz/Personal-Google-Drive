import express from "express";
import cors from "cors";
import fs, { readdir } from "fs/promises";
import { createWriteStream } from "fs";
import path from "node:path";

const app = express();

app.use(cors());
app.use(express.json());

// serving directory contents
app.get("/directory/{*path}", async (req, res) => {
  const dirpath = req.params.path ?? [];

  const full_dir_path = path.join("storage/", path.join("/", ...dirpath));

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

app.post("/directory/*path", async (req, res) => {
  const dirpath = req.params.path;
  const full_dir_path = path.join("storage", path.join("/", ...dirpath));

  console.log(full_dir_path);

  await fs.mkdir(full_dir_path);

  res.json({ message: "Directory Created" });
});

// serving file contents
app.get("/files/*path", (req, res) => {
  const filepath = req.params.path ?? [];

  const fullpath = path.join(
    import.meta.dirname,
    "storage/",
    path.join("/", ...filepath),
  );

  if (req.query.action === "download")
    res.header("Content-Disposition", `attachment;`);

  res.sendFile(fullpath);
});

// file upload
app.post("/files/*path", (req, res) => {
  const filepath = path.join("storage", path.join("/", ...req.params.path));
  const write_stream = createWriteStream(filepath);

  req.pipe(write_stream);

  res.status(201).json({ message: "Got the File!" });
});

// file renaming
app.patch("/files/*path", async (req, res) => {
  if (!req.body.new_filename)
    return res.status(400).json({ message: "new filename required!" });

  let filepath = req.params.path ?? [];
  console.log(filepath);

  const old_filename = path.join("storage", path.join("/", ...filepath));
  const new_filename = path.join(
    "storage",
    path.join("/", ...filepath.slice(0, -1)),
    path.join("/", req.body.new_filename),
  );

  await fs.rename(old_filename, new_filename);
  res.status(200).json({ message: "File Renamed!" });
});

// file deletion
app.delete("/files/*path", async (req, res) => {
  const filepath = req.params.path ?? [];
  const fullpath = path.join("storage", path.join("/", ...filepath));
  await fs.rm(fullpath, { recursive: true, force: true });

  res.status(200).json({ message: "File Deleted!" });
});

app.listen(8080, () => console.log("server is running at port 8080"));
