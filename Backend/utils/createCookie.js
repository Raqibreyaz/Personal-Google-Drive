export default function createCookie(res,sessionId) {
  const expiryAgeInSec = 86400;

  res.cookie("authToken", sessionId, {
    httpOnly: true,
    signed: true,
    secure: true,
    sameSite: "none",
    maxAge: expiryAgeInSec * 1000,
  });
}
