import fs from "node:fs/promises";
import path from "node:path";

export const deleteDirRecursively = async (currDirId, dirsDB, filesDB) => {
  // find the directory from dirDB
  const dir_ind = dirsDB.findIndex((dir) => dir.id === currDirId);
  if (dir_ind === -1) return;

  const dir = dirsDB[dir_ind];

  // remove all the sub-directories and their contents recursively
  for (const dirId of dir.directories)
    await deleteDirRecursively(dirId, dirsDB, filesDB);

  // removing all the files now
  for (const fileId of dir.files) {
    const fileIndex = filesDB.findIndex((file) => file.id === fileId);
    await fs.rm(
      path.join(process.cwd(), "storage", fileId + filesDB[fileIndex].extname),
    );
    filesDB.splice(fileIndex, 1);
  }

  // remove the curr-dir from dirsDB now
  dirsDB.splice(dir_ind, 1);
};
