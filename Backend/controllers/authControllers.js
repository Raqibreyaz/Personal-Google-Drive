import OTP from "../models/otpModel.js";
import ApiError from "../utils/apiError.js";
import sendOtpService from "../utils/sendOtpService.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const result = await sendOtpService(email);
  res.status(200).json(result);
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new ApiError(400, "Email and Otp both are required!");

  const otpDoc = await OTP.findOne({ email });
  const isOtpValid = otpDoc ? await otpDoc.compareOtp(otp.toString()) : false;
  if (!otpDoc || !isOtpValid) throw new ApiError(400, "Invalid OTP!");
  await otpDoc.deleteOne();

  res.status(200).json({ message: "OTP verified successfully!" });
};
