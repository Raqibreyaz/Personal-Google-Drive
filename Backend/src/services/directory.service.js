import fs from "node:fs/promises";
import path from "node:path";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import FileShare from "../models/fileShare.model.js";
import appRootPath from "app-root-path";
import mongoose from "mongoose";

// take all the file Ids and directory Ids in an array
export const deleteDirRecursively = async (currDirId) => {
  const dirIds = [];
  const fileInfos = [];

  await getFileAndDirIds(currDirId, dirIds, fileInfos);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fileIds = fileInfos.map((f) => f.fileId);
    if (fileIds.length) {
      await File.deleteMany({ _id: { $in: fileIds } }, { session });
      await FileShare.deleteMany({ file: { $in: fileIds } }, { session });
    }
    await Directory.deleteMany({ _id: { $in: dirIds } }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  // Disk cleanup AFTER commit — orphans are harmless
  for (const { filePath } of fileInfos) {
    await fs.rm(filePath, { force: true }).catch(() => {});
  }
};

async function getFileAndDirIds(currDirId, dirIds, fileInfos) {
  // get all the sub-directories of current directory
  const directories = await Directory.find({ parentDir: currDirId })
    .select("_id")
    .lean();

  // get all the files of the current directory
  const files = await File.find({ parentDir: currDirId })
    .select("extname")
    .lean();

  // get all sub directories Ids and their content's Ids recursively
  for (const { _id: dirId } of directories) {
    await getFileAndDirIds(dirId, dirIds, fileInfos);
    dirIds.push(dirId);
  }

  // removing all the files from storage
  for (const { _id: fileId, extname } of files) {
    const filePath = path.join(appRootPath.path, "storage", fileId.toString() + extname);
    fileInfos.push({ fileId, filePath });
  }

  dirIds.push(currDirId);
}
