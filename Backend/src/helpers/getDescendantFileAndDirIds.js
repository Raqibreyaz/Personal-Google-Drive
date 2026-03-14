import path from "node:path";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import appRootPath from "app-root-path";

export default async function getDescendantFileAndDirIds(
  currDirId,
  dirIds,
  fileInfos,
) {
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
    await getDescendantFileAndDirIds(dirId, dirIds, fileInfos);
    dirIds.push(dirId);
  }

  // removing all the files from storage
  for (const { _id: fileId, extname } of files) {
    const filePath = path.join(
      appRootPath.path,
      "storage",
      fileId.toString() + extname,
    );
    fileInfos.push({ fileId, filePath });
  }
}
