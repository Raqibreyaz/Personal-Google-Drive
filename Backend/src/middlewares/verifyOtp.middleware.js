import OTP from "../models/otp.model.js";
import ApiError from "../helpers/apiError.js";
import { MISSING_DATA, INVALID_INPUT } from "../constants/errorCodes.js";

export default async function verifyOtp(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new ApiError(400, "Email and Otp both are required!", MISSING_DATA);

  const otpDoc = await OTP.findOne({ email });
  const isOtpValid = otpDoc ? await otpDoc.compareOtp(otp.toString()) : false;
  if (!otpDoc || !isOtpValid) throw new ApiError(400, "Invalid OTP!", INVALID_INPUT);
  await otpDoc.deleteOne();

  next();
}
