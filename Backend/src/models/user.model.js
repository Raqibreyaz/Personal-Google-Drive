import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Role from "../constants/role.js";
import Provider from "../constants/provider.js";

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
      enum: Object.values(Provider),
      default: Provider.LOCAL,
    },
    // only for local users
    password: {
      type: String,
      trim: true,
      minLength: 4,
      required: function () {
        return this.authProvier === Provider.LOCAL;
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
        return this.authProvider !== Provider.LOCAL;
      },
    },
    picture: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    storageDir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Directory",
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

userSchema.statics.Role = Role;
userSchema.statics.Provider = Provider;

const User = mongoose.model("User", userSchema);
export default User;
