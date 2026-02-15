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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide valid email address",
      ],
      required: [true, "Email is required!"],
      unique: true,
    },
    authProvider: {
      type: String,
      trim: true,
      enum: ["local", "google", "github"],
      default: "local",
    },
    // only for local users
    password: {
      type: String,
      trim: true,
      minLength: 4,
      required: function () {
        return this.authProvier === "local";
      },
      select: false, //never return password in queries
    },
    // only for OpenId-Connect users
    providerId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, //skip uniqueness for 'null' values
      required: function () {
        return this.authProvider !== "local";
      },
    },
    picture: {
      type: String,
      trim: true,
    },
    storageDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "directory",
      required: [true, "A storage directory must be assigned to the user"],
    },
  },
  { strict: "throw", timestamps: true },
);

userSchema.pre("save", async function () {
  if (this.isModified("password") && this.password)
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (receivedPassword) {
  return await bcrypt.compare(receivedPassword, this.password);
};

export default mongoose.model("user", userSchema);
