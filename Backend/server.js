import http from "http";
import fs, { readdir } from "fs/promises";
import mime from "mime/lite";
import { createWriteStream } from "fs";

const server = http.createServer();

// open the requested file and serve it
server.on("request", async (req, res) => {
  let filepath = "storage";
  let file_handle = null;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

  if (req.method === "GET") {
    if (req.url) {
      const fname = req.url.startsWith("/")
        ? decodeURIComponent(req.url.slice(1))
        : "storage";
      if (fname) filepath = fname;
    }

    try {
      const is_open = filepath.includes("open");
      filepath = filepath.replaceAll("/open", "").replaceAll("/download", "");

      const st = await fs.lstat(filepath);

      // return files list when directory
      if (st.isDirectory()) {
        const files = await readdir(filepath, { withFileTypes: true }).then(
          (dirents) =>
            dirents
              .filter((dirent) => dirent.isDirectory() || dirent.isFile())
              .map((dirent) => ({
                is_directory: dirent.isDirectory(),
                name: dirent.name,
                parent_path: dirent.parentPath,
              }))
        );
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(files));
      }

      // open the file
      file_handle = await fs.open(filepath);

      const filename = filepath.slice(filepath.lastIndexOf("/") + 1);
      const mime_type = mime.getType(filename);

      // create a readable stream for the file
      const read_stream = file_handle.createReadStream();

      // get the size of the file
      const { size } = await file_handle.stat();

      // add size of file as content-length
      res.setHeader("Content-Length", size);

      // add content type of file
      res.setHeader("Content-Type", mime_type);

      if (!is_open)
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${filename}`
        );

      read_stream.pipe(res);

      // close file and socket now
      read_stream.on("end", () => {
        res.end();
        file_handle?.close();
        file_handle = null;
      });
    } catch (err) {
      // when file not found
      console.error(err.message);
      res.statusCode = 404;
      res.end("File not Found!");
      file_handle?.close();
    }
  } else if (req.method === "POST") {
    const filename = req.headers.filename ?? "new-file";
    const write_stream = createWriteStream(`storage/${filename}`);

    req.pipe(write_stream);

    res.end("Got the file!");
  } else if (req.method === "OPTIONS") {
    res.end("OK");
  } else if (req.method === "DELETE") {
    const filename = req.headers.filename;
    if (!filename) return res.end("Invalid filename!");

    await fs.rm(`storage/${filename}`);
    res.end("File Deleted!");
  } else if (req.method === "PUT") {
    if (!req.headers.old_filename || !req.headers.new_filename)
      return res.end("invalid filename!");

    const old_filename = `storage/${req.headers.old_filename}`;
    const new_filename = `storage/${req.headers.new_filename}`;

    await fs.rename(old_filename, new_filename);
    res.end("File Renamed!");
  }
});

server.listen(8080, () => {
  console.log("server is running at port 8080");
});
