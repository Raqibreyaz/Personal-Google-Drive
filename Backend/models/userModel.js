import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minLength: 3,
      required: [true, "Name of user is required!"],
    },
    password: {
      type: String,
      trim: true,
      minLength: 4,
      required: [true, "Password is required!"],
    },
    email: {
      type: String,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide valid email address",
      ],
      required: [true, "Email is required!"],
      unique: true,
    },
    storageDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "directory",
      required: [true, "A storage directory must be assigned to the user"],
    },
  },
  { strict: "throw" },
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.methods.comparePassword = async function (receivedPassword) {
  return await bcrypt.compare(receivedPassword, this.password);
};

export default mongoose.model("user", userSchema);
