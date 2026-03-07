export default function createCookie(res, sessionId) {
  const expiryAgeInSec = Number(process.env.COOKIE_EXPIRY || 86400);
  const domain = process.env.SITE_DOMAIN || ".local.com";

  res.cookie("authToken", sessionId, {
    domain,
    httpOnly: true,
    signed: true,
    sameSite: "lax",
    maxAge: expiryAgeInSec * 1000,
  });
}
