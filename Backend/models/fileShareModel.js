import mongoose from "mongoose";

const fileShareSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "fileId is required!"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "userId is required!"],
    },
    permission: {
      type: String,
      enum: ["View", "Edit"],
      default: "View",
    },
  },
  { strict: "throw" },
);

// for neglecting duplicates, compound unique index
fileShareSchema.index({ file: 1, user: 1 }, { unique: true });

// for files shared with me
fileShareSchema.index({ user: 1 });

const FileShare = mongoose.model("FileShare", fileShareSchema);
export default FileShare;
