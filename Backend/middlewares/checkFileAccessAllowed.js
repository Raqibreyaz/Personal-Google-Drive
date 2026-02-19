/*
- does this file belongs to the logged-in user?
- does this file shared with the logged-in user?
*/

import ApiError from "../utils/apiError.js";
import File from "../models/fileModel.js";
import FileShare from "../models/fileShareModel.js";

export default async function checkFileAccessAllowed(req, res, next) {
  const fileId = req.params.fileId;
  const loggedInUserId = req.session.user._id.toString();

  const file = await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  req.fileDoc = file;

  // direct allow the file owner
  if (file.user.equals(loggedInUserId)) return next();

  // allow the file viewer due to global allowance
  if (file.allowAnyoneAccess === "View" && req.method === "GET") return next();

  // allow the file editor due to global allowance
  if (file.allowAnyoneAccess === "Edit") return next();

  // find if the file shared to that user
  const fileShare = await FileShare.findOne({
    file: fileId,
    user: loggedInUserId,
  }).lean();

  if (fileShare) {
    // allow the file editor
    if (fileShare.permission === "Edit") return next();

    // allow the file viewer to view
    if (fileShare.permission === "View" && req.method === "GET") return next();
  }

  throw new ApiError(400, "You are not authorized to access this data!");
}
