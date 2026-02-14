import fs from "node:fs/promises";
import path from "node:path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";

export const deleteDirRecursively = async (currDirId) => {
  // get all the sub-directories of current directory
  const directories = await Directory.find({ parentDir: currDirId })
    .select("_id")
    .lean();
  // get all the files of the current directory
  const files = await File.find({ parentDir: currDirId })
    .select("extname")
    .lean();

  // remove all the sub-directories and their contents recursively
  for (const { _id: dirId } of directories) await deleteDirRecursively(dirId);

  // removing all the files from storage
  for (const { _id: fileId, extname } of files) {
    await fs.rm(path.join(process.cwd(), "storage", fileId + extname));
  }

  // remove all the files from DB where parent is 'dir'
  if (files.length) await File.deleteMany({ parentDir: currDirId });

  // remove the curr-dir from Directory now
  await Directory.findByIdAndDelete(currDirId);
};

// [Error: ENOENT: no such file or directory, lstat '/mnt/data1/my-files/Projects/Personal-Google-Drive/Backend/storage/6990a8018cf2fad472d40ae8undefined'] {
//   errno: -2,
//   code: 'ENOENT',
//   syscall: 'lstat',
//   path: '/mnt/data1/my-files/Projects/Personal-Google-Drive/Backend/storage/6990a8018cf2fad472d40ae8undefined'
// }
