import fs from "node:fs/promises";
import path from "node:path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const deleteDirRecursively = async (currDirId) => {
  // get all the sub-directories of current directory
  const directories = await Directory.find(
    { parentDir: currDirId },
    { projection: { _id: 1 } },
  );
  // get all the files of the current directory
  const files = await File.find(
    { parentDir: currDirId },
    { projection: { extname: 1 } },
  );

  // remove all the sub-directories and their contents recursively
  for (const { _id: dirId } of directories) await deleteDirRecursively(dirId);

  // removing all the files from storage
  for (const { _id: fileId, extname } of files) {
    await fs.rm(path.join(process.cwd(), "storage", fileId + extname));
  }
  // remove all the files from DB where parent is 'dir'
  await File.deleteMany({ parentDir: currDirId });

  // remove the curr-dir from Directory now
  await Directory.findByIdAndDelete(currDirId);
};
