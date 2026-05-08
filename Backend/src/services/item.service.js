import { deleteObjects } from "./aws.service.js";
import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import FileShare from "../models/fileShare.model.js";
import updateParentSize from "../helpers/updateParentSize.js";
import getDescendantFileAndDirIds from "../helpers/getDescendantFileAndDirIds.js";

/**
 * Perform an atomic bulk deletion of directories and files.
 * @param {Array} selectedDirs - Array of directory documents to delete.
 * @param {Array} selectedFiles - Array of file documents to delete.
 */
export const bulkDeleteItemsService = async (selectedDirs, selectedFiles) => {
  const dirIds = [];
  const fileInfos = [];

  // Determine descendants for all selected directories
  for (const dir of selectedDirs) {
    await getDescendantFileAndDirIds(dir._id, dirIds, fileInfos);
    dirIds.push(dir._id);
  }

  // Add specifically selected files to deletion task
  for (const { _id: fileId } of selectedFiles) {
    const objectKey = fileId.toString();
    fileInfos.push({ fileId, objectKey });
  }

  // Calculate total size to be decreased
  let decreasingSize = 0;
  for (const { size } of selectedDirs) decreasingSize += size;
  for (const { size } of selectedFiles) decreasingSize += size;

  const parentDirId = selectedDirs.length
    ? selectedDirs[0].parentDir
    : selectedFiles[0]?.parentDir;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const fileIds = fileInfos.map((f) => f.fileId);
      if (fileIds.length) {
        await File.deleteMany({ _id: { $in: fileIds } }, { session });
        await FileShare.deleteMany({ file: { $in: fileIds } }, { session });
      }

      if (dirIds.length) {
        await Directory.deleteMany({ _id: { $in: dirIds } }, { session });
      }

      if (parentDirId) {
        await updateParentSize(parentDirId, -decreasingSize, session);
      }
    });
  } finally {
    await session.endSession();
  }

  // S3 cleanup AFTER commit (orphan files are harmless)
  await deleteObjects(fileInfos.map((file) => ({ Key: file.objectKey })));
};
