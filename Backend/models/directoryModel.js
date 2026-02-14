import mongoose from "mongoose";

const directorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Directory name is required!"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "A user must be assigned to the directory"],
    },
    parentDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  { strict: "throw", timestamps: true },
);

export default mongoose.model("directory", directorySchema);
