import User from "../models/user.model.js";
import File from "../models/file.model.js";
import FileShare from "../models/fileShare.model.js";
import ApiError from "../helpers/apiError.js";

export const filesSharedWithMe = async (req, res, next) => {
  const userId = req.targetUserId || req.session.user._id.toString();
  const sharedFiles = await FileShare.find({ user: userId })
    .populate("file", "name size") //only select name,size from file
    .select("permission -_id")
    .lean();

  res.status(200).json(sharedFiles);
};

export const shareFile = async (req, res, next) => {
  const fileId = req.params.fileId;
  const file = req.fileDoc ? req.fileDoc : await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  const userEmail = req.body.userEmail;
  const receiver = await User.findOne({ email: userEmail }).lean();
  if (!receiver) throw new ApiError(404, "Receiver doesn't exist!");

  const permission = req.body.permission;

  const result = await FileShare.updateOne(
    { file: file._id, user: receiver._id },
    { $set: { permission } },
    { upsert: true },
  );

  if (!result.acknowledged) throw new ApiError(400, "Failed to share file!");

  res
    .status(200)
    .json({ fileLink: `${process.env.BACKEND_URI}/file/${fileId}` });
};

export const listUsersHavingTheFile = async (req, res, next) => {
  const fileId = req.params.fileId;
  const file = req.fileDoc ? req.fileDoc : await File.findById(fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  const permittedUsers = await FileShare.find({ file: fileId })
    .populate("user", "-_id name email")
    .select("-file -__v")
    .lean();

  res.status(200).json(permittedUsers);
};

export const revokeAccess = async (req, res, next) => {
  const file = req.fileDoc
    ? req.fileDoc
    : await File.findById(req.params.fileId).lean();
  if (!file) throw new ApiError(404, "File not found!");

  const userEmail = req.body.userEmail;
  const receiver = await User.findOne({ email: userEmail }).lean();
  if (!receiver) throw new ApiError(404, "Receiver doesn't exist!");

  const result = await FileShare.deleteOne({
    file: file._id,
    user: receiver._id,
  });

  if (!result.deletedCount) throw new ApiError(400, "Failed to revoke access!");

  res.status(200).json({ message: "File access revoked successfully!" });
};
