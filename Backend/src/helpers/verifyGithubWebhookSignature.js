import crypto from "node:crypto";

export default function verifyGithubWebhookSignature(signature, rawBody) {
  if (!signature || !rawBody) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // github adds a 'sha256=' prefix in the signature
  const generatedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  // timingSafeEqual does not allow strings so creating buffers
  const sigBuf = Buffer.from(signature, "utf-8");
  const genSigBuf = Buffer.from(generatedSignature, "utf-8");

  return (
    sigBuf.length === genSigBuf.length &&
    crypto.timingSafeEqual(sigBuf, genSigBuf)
  );
}
