import fs from "node:fs/promises";
import path from "node:path";

export const deleteDirRecursively = async (
  currDirId,
  directoryCollection,
  filesCollection,
) => {
  // get all the sub-directories of current directory
  const directories = await directoryCollection.find(
    { parentDir: currDirId },
    { projection: { _id: 1 } },
  ).toArray();
  // get all the files of the current directory
  const files = await filesCollection
    .find({ parentDir: currDirId }, { projection: { extname: 1 } })
    .toArray();

  // remove all the sub-directories and their contents recursively
  for (const { _id: dirId } of directories)
    await deleteDirRecursively(dirId, directoryCollection, filesCollection);

  // removing all the files from storage
  for (const { _id: fileId, extname } of files) {
    await fs.rm(path.join(process.cwd(), "storage", fileId + extname));
  }
  // remove all the files from DB where parent is 'dir'
  await filesCollection.deleteMany({ parentDir: currDirId });

  // remove the curr-dir from directoryCollection now
  await directoryCollection.deleteOne({ _id: currDirId });
};
