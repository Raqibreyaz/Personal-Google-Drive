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
      ref: "User",
      required: [true, "A user must be assigned to the directory"],
    },
    parentDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Directory",
      default: null,
    },
    path: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Directory",
      },
    ],
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { strict: "throw", timestamps: true },
);

//ToDo
// directorySchema.index({ name: 1, parentDir: 1 }, { unique: true });

const Directory = mongoose.model("Directory", directorySchema);
export default Directory;
