import ApiError from "../utils/apiError.js";
import Role from "../utils/role.js";
import File from "../models/fileModel.js";
import FileShare from "../models/fileShareModel.js";
import Directory from "../models/directoryModel.js";

export default async function authorizeDataAccess(req, res, next) {
  const loggedInUserId = req.session.user._id.toString();
  const loggedInUserRole = req.session.user.role;

  req.targetUserId = req.params.userId || loggedInUserId;

  // direct allow app owner
  if (loggedInUserRole === Role.OWNER) {
    return next();
  }

  // direct allow app admin for 'get' access
  if (loggedInUserRole === Role.ADMIN && req.method === "GET") {
    return next();
  }

  // currently only files are allowed to be shared
  if (req.params.fileId) {
    const fileId = req.params.fileId;

    const file = await File.findById(fileId).lean();
    if (!file) throw new ApiError(404, "File not found!");

    req.file = file;

    // direct allow the file owner
    if (file.user.equals(loggedInUserId)) return next();

    // allow the file viewer due to global allowance
    if (file.allowAnyoneAccess === "View" && req.method === "GET")
      return next();

    // allow the file editor due to global allowance
    if (file.allowAnyoneAccess === "Edit") return next();

    // find if the file shared to that user
    const fileShare = await FileShare.findOne({
      file: fileId,
      user: loggedInUserId,
    }).lean();

    // allow the file editor
    if (fileShare.permission === "Edit") return next();

    // allow the file viewer to view
    if (fileShare.permission === "View" && req.method === "GET") return next();
  }

  if (req.params.dirId || req.body.parentDirId) {
    const dirId = req.params.dirId || req.body.parentDirId;

    const directory = await Directory.findById(dirId).lean();
    if (!directory) throw new ApiError(404, "Directory not found!");

    // direct allow the directory owner
    if (directory.user.equals(loggedInUserId)) {
      req.directory = directory;
      return next();
    }
  }

  throw new ApiError(403, "You are not authorized to access this user's data!");
}
