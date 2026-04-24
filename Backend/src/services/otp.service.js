import nodemailer from "nodemailer";
import crypto from "crypto";
import OTP from "../models/otp.model.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.NODEMAILER_EMAIL,
    refreshToken: process.env.NODEMAILER_REFRESH_TOKEN,
    clientId: process.env.NODEMAILER_CLIENT_ID,
    clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
  },
});

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

  const info = await transporter.sendMail({
    from: `Storage App ${process.env.NODEMAILER_EMAIL}`,
    to: email,
    subject: "Storage App OTP",
    html,
  });
  console.log(info.messageId);

  return { success: true, message: "OTP sent successfully!" };
}
