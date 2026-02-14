import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

export default async function verifyIdToken(idToken) {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience:
      "<client_id>",
  });

  return loginTicket.getPayload();
}
