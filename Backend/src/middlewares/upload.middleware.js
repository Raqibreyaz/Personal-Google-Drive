import path from "node:path";
import multer from "multer";
import { ObjectId } from "mongodb";
import fs from "fs/promises";
import appRootPath from "app-root-path";

const storageDirPath = path.join(appRootPath.path, "storage");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageDirPath);
  },
  filename: function (req, file, cb) {
    const fileId = new ObjectId().toString();
    const filename = fileId + path.extname(file.originalname);

    // when file upload interrupted then delete file
    req.on("aborted", async () => {
      const filepath = path.join(storageDirPath, filename);
      await fs.unlink(filepath);
    });

    cb(null, filename);
  },
});

export default multer({ storage });
