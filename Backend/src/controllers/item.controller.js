import { ObjectId } from "mongodb";
import ApiError from "../helpers/apiError.js";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import { INVALID_SELECTION, DIFFERENT_PARENTS } from "../constants/errorCodes.js";
import { bulkDeleteItemsService } from "../services/item.service.js";

export const bulkDelete = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const selectedDirIds = (req.body.selectedDirs || []).map((id) => new ObjectId(id));
  const selectedFileIds = (req.body.selectedFiles || []).map((id) => new ObjectId(id));

  let selectedDirs = [];
  if (selectedDirIds.length) {
    selectedDirs = await Directory.find({
      _id: { $in: selectedDirIds },
      user: userId,
    })
      .select("_id parentDir size")
      .lean();
  }

  let selectedFiles = [];
  if (selectedFileIds.length) {
    selectedFiles = await File.find({
      _id: { $in: selectedFileIds },
      user: userId,
    })
      .select("_id parentDir size extname")
      .lean();
  }

  const uniqueParents = new Set([
    ...selectedFiles.map(({ parentDir }) => (parentDir ? parentDir.toString() : "root")),
    ...selectedDirs.map(({ parentDir }) => (parentDir ? parentDir.toString() : "root")),
  ]);

  if (uniqueParents.size > 1) {
    throw new ApiError(
      400,
      "All selected files and directories should be of same parent!",
      DIFFERENT_PARENTS
    );
  }

  if (!selectedDirs.length && !selectedFiles.length) {
    throw new ApiError(
      400,
      "Either directories/files not exist or you are not authorized for it!",
      INVALID_SELECTION
    );
  }

  // Delegate the complex transaction and recursive logic to generic service
  await bulkDeleteItemsService(selectedDirs, selectedFiles);

  res.status(200).json({ message: "All selected entries deleted successfully!" });
};
