import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Filename required!"],
    },
    size: {
      type: Number,
      min: 0,
      required: [true, "File size required!"],
    },
    parentDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Directory",
      required: [true, "Provide File's parent!"],
    },
    extname: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provide the user of the file!"],
    },
    allowAnyoneAccess: {
      type: String,
      enum: ["View", "Edit", null],
      default: null,
    },
    isUploading: {
      type: Boolean,
      default: true,
    },
  },
  { strict: "throw", timestamps: true },
);

fileSchema.index({ parentDir: 1, name: 1 }, { unique: true });

const File = mongoose.model("File", fileSchema);
export default File;
