import http from "http";
import fs, { readdir } from "fs/promises";
import mime from ".pnpm/mime@4.1.0/node_modules/mime/lite";

const server = http.createServer();

// open the requested file and serve it
server.on("request", async (req, res) => {
  let filepath = "storage";
  let file_handle = null;

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

    if (st.isDirectory()) {
      const home_page = await fs.readFile("home-page.html");

      const files = await readdir(filepath, { withFileTypes: true }).then(
        (dirents) =>
          dirents.filter((dirent) => dirent.isDirectory() || dirent.isFile())
      );

      let dynamic_list = files.reduce(
        (previous_names, dirent) =>
          previous_names +
          `<li>${dirent.name}
              <a href="/${dirent.parentPath}/${dirent.name}/open">Open</a>
              ${
                dirent.isDirectory()
                  ? ""
                  : `<a href="/${dirent.parentPath}/${dirent.name}/download">Download</a>`
              }
          </li>\n`,
        ""
      );

      return res.end(
        home_page.toString().replaceAll("${dynamic_list}", dynamic_list)
      );
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
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

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
});

server.listen(8080, () => {
  console.log("server is running at port 8080");
});
