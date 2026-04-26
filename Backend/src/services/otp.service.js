import crypto from "crypto";
import OTP from "../models/otp.model.js";
import sendEmail from "./email.service.js";

export default async function sendOtpService(email) {
  const otp = crypto.randomInt(100000, 999999);

  await OTP.findOneAndUpdate(
    { email },
    {
      $set: {
        otp: otp.toString(),
        expiresAt: new Date((Date.now() / 1000 + 600) * 1000),
      },
    },
    { upsert: true },
  );

  const html = `
    <div style="font-family:sans-serif;">
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;

  const messageId = await sendEmail(email, "Storage App OTP", html);

  return { success: true, message: "OTP sent successfully!", messageId };
}
