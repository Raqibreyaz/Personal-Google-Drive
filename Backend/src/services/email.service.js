import nodemailer from "nodemailer";

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

export default async function sendEmail(email, subject, htmlMessage) {
  const info = await transporter.sendMail({
    from: `Storage App ${process.env.NODEMAILER_EMAIL}`,
    to: email,
    subject,
    html: htmlMessage,
  });

  console.log(info.messageId);
  return info.messageId;
}
