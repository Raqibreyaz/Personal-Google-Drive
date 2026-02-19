import mongoose from "mongoose";
import bcrypt from "bcrypt";

const otpSchema = new mongoose.Schema(
  {
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
    otp: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 4,
    },
    expiresAt: {
      type: Date,
      expires: 600,
    },
  },
  { strict: "throw" },
);

otpSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.$set?.otp) {
    const plainOtp = update.$set.otp.toString();
    update.$set.otp = await bcrypt.hash(plainOtp, 10);
  }
});

otpSchema.methods.compareOtp = async function (receivedOtp) {
  return await bcrypt.compare(receivedOtp.toString(), this.otp);
};

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
