import fs from "node:fs/promises";
import path from "node:path";

export const deleteDirRecursively = async (
  currDirId,
  directoryCollection,
  filesCollection,
) => {
  // find the directory from dirDB
  const dir = await directoryCollection.findOne({ _id: currDirId });
  if (!dir) return;

  // remove all the sub-directories and their contents recursively
  for (const dirId of dir.directories)
    await deleteDirRecursively(dirId, directoryCollection, filesCollection);

  // removing all the files now
  for (const fileId of dir.files) {
    const file = await filesCollection.findOne({ _id: fileId });
    await fs.rm(path.join(process.cwd(), "storage", fileId + file.extname));
    const deleteRes = await filesCollection.deleteOne({ _id: fileId });
    console.log(deleteRes);
  }

  // remove the curr-dir from directoryCollection now
  const deleteRes = await directoryCollection.deleteOne({ _id: currDirId });
  console.log(deleteRes);
};
