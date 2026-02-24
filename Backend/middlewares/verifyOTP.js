import OTP from "../models/otpModel.js";
import ApiError from "../utils/apiError.js";

export default async function verifyOtp(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new ApiError(400, "Email and Otp both are required!");

  const otpDoc = await OTP.findOne({ email });
  const isOtpValid = otpDoc ? await otpDoc.compareOtp(otp.toString()) : false;
  if (!otpDoc || !isOtpValid) throw new ApiError(400, "Invalid OTP!");
  await otpDoc.deleteOne();

  next()
}
