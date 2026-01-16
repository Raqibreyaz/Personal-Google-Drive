import express from "express";
import fs, { readdir } from "fs/promises";
import { createWriteStream } from "fs";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

// serving directory contents here
app.get("/", async (req, res) => {
  const filename = req.query.filename ?? "storage";

  const files = await readdir(filename, { withFileTypes: true }).then(
    (dirents) =>
      dirents
        .filter((dirent) => dirent.isDirectory() || dirent.isFile())
        .map((dirent) => ({
          is_directory: dirent.isDirectory(),
          name: dirent.name,
          parent_path: dirent.parentPath,
        }))
  );
  res.header("Content-Type", "application/json");
  return res.status(200).json(files);
});

app.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  if (req.query.action === "download")
    res.header(
      "Content-Disposition",
      `attachment;${req.query.filename ? `filename=${req.query.filename}` : ""}`
    );

  res.sendFile(`${import.meta.dirname}/storage/${filename}`);
});

app.post("/", (req, res) => {
  if (!req.query.filename)
    return res.status(400).json({ message: "filename required!" });

  const filename = req.query.filename;
  const write_stream = createWriteStream(`storage/${filename}`);

  req.pipe(write_stream);

  res.status(201).json({ message: "Got the File!" });
});

app.patch("/:filename", async (req, res) => {
  if (!req.body.new_filename)
    return res.status(400).json({ message: "old and new filename required!" });

  const old_filename = `storage/${req.params.filename}`;
  const new_filename = `storage/${req.body.new_filename}`;

  await fs.rename(old_filename, new_filename);
  res.status(200).json({ message: "File Renamed!" });
});

app.delete("/:filename", async (req, res) => {
  const filename = `storage/${req.params.filename}`;

  await fs.rm(filename);

  res.status(200).json({ message: "File Deleted!" });
});

app.listen(8080, () => console.log("server is running at port 8080"));
