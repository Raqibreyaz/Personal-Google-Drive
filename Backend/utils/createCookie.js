export default function createCookie(res, userId, sessionId) {
  const expiryAgeInSec = 86400;
  const payload = JSON.stringify({
    userId,
    sessionId,
  });

  res.cookie("authToken", payload, {
    httpOnly: true,
    signed: true,
    secure: true,
    sameSite: "none",
    maxAge: expiryAgeInSec * 1000,
  });

  return payload;
}
