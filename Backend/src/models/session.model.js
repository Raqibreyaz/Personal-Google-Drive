import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date((Date.now() / 1000 + 3600) * 1000); //1hr by default
      },
    },
  },
  { strict: "throw" },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
