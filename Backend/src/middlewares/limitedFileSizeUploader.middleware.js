import path from "node:path";
import { ObjectId } from "mongodb";
import appRootPath from "app-root-path";
import { createWriteStream } from "node:fs";
import ApiError from "../helpers/apiError.js";
import dataSanitizer from "../helpers/dataSanitizer.js";
import { INVALID_INPUT } from "../constants/errorCodes.js";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import Directory from "../models/directory.model.js";

const storageDirPath = path.join(appRootPath.path, "storage");
const MAX_FILE_SIZE_LIMIT = 1600 * 1024 * 1024;

export default async function fileUpload(req, res, next) {
  const rootDir = await Directory.findById(req.session.user.storageDir)
    .select("size")
    .lean();

  const usedStorageInBytes = rootDir?.size || 0;
  const maxStorageInBytes = req.session.user.maxStorageInBytes;
  const availableSpace = Math.max(0, maxStorageInBytes - usedStorageInBytes);
  const effectiveMaxLimit = Math.min(MAX_FILE_SIZE_LIMIT, availableSpace);

  const headersSchema = z.object({
    filesize: z.coerce
      .number({ error: "FileSize should be a number" })
      .min(0, { error: "FileSize cannot be negative" })
      .max(effectiveMaxLimit, { error: "FileSize too large!" }),
    filename: z
      .string({ error: "Filename is required!" })
      .min(1, { error: "Filename cannot be empty!" })
      .refine((val) => dataSanitizer.sanitize(val) === val, {
        error: "Invalid Filename!",
      }),
  });

  const result = headersSchema.safeParse(req.headers);

  /*
  can also use these:
  req.socket.destroy()
  req.destroy()
  return res.destroy();
  */
  if (!result.success) {
    const issue = result.error.issues[0];
    let statusCode = 400;
    let errorCode = INVALID_INPUT;

    // If the filesize exceeds the z.max() limit
    if (issue.path[0] === "filesize" && issue.code === "too_big") {
      statusCode = 413;
      errorCode = "FILE_SIZE_LIMIT_EXCEEDED";
    }

    res.set("Connection", "close"); //important when client started uploading
    return next(new ApiError(statusCode, issue.message, errorCode));
  }

  const { filename } = result.data;

  const fileId = new ObjectId().toString();
  const fileExt = path.extname(filename);
  const filepath = path.join(storageDirPath, fileId + fileExt);

  const writeStream = createWriteStream(filepath);

  writeStream.on("drain", () => {
    req.resume();
  });
  writeStream.on("finish", () => {
    req.file = {
      filename: fileId + fileExt,
      originalname: filename,
      size: bytesWritten,
    };
    next();
  });
  writeStream.on("error", (error) => {
    if (!req.destroyed) req.destroy();
  });

  let bytesWritten = 0;
  req.on("data", (chunk) => {
    if (writeStream.destroyed) return;

    bytesWritten += chunk.length;
    if (bytesWritten > effectiveMaxLimit) {
      writeStream.destroy();
      unlink(filepath).catch(console.error);
      return req.destroy();
    }

    if (!writeStream.write(chunk)) req.pause();
  });
  req.on("end", () => {
    if (writeStream.destroyed || writeStream.closed) return;
    writeStream.end();
  });
  req.on("error", (error) => {
    if (!writeStream.destroyed) {
      writeStream.destroy();
      unlink(filepath).catch(console.error);
    }
  });
  req.on("close", () => {
    if (req.complete || writeStream.destroyed) return;
    writeStream.destroy();
    unlink(filepath).catch(console.error);
  });
}
