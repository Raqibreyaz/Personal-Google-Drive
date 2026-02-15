import nodemailer from "nodemailer";
import OTP from "../models/otpModel.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

export default async function sendOtpService(email) {
  const otp = Math.floor(Math.random() * 9000 + 1000);

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
