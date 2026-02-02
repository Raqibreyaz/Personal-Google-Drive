import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    trim:true,
    required: [true, "Filename required!"],
  },
  size: {
    type: Number,
    required: [true, "File size required!"],
  },
  parentDir: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "directory",
    required: [true, "Provide File's parent!"],
  },
  extname: {
    type: String,
    trim:true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "Provide the user of the file!"],
  },
},{ strict: "throw" },);

export default mongoose.model("file", fileSchema);
