import { ipKeyGenerator } from "express-rate-limit";

// ─── Key generators ──────────────────────────────────────────────────────────
/** Authenticated routes: identify by user-id, fall back to IP */
export const userKeyGenerator = (req) =>
  req.session?.user?._id?.toString() || ipKeyGenerator(req.ip);

/** Pre-auth routes (login, register, OTP): identify by IP only */
export const ipOnlyKeyGenerator = (req) => ipKeyGenerator(req.ip);

// ─── Throttle preset profiles ────────────────────────────────────────────────
// Each preset defines { freeRequests, timeGapInSec }.
// Routes reference these by name:  throttleRequest("READ")
const THROTTLE_PRESETS = {
  // Reads — generous burst, short cooldown
  READ: { freeRequests: 5, timeGapInSec: 2 },

  // Creates — moderate burst (file upload, dir create)
  WRITE: { freeRequests: 3, timeGapInSec: 3 },

  // Mutations — rename, delete, set-access, share, revoke
  MUTATE: { freeRequests: 2, timeGapInSec: 3 },

  // Auth — register, login (after OTP)
  AUTH: { freeRequests: 1, timeGapInSec: 5 },

  // 3rd-party OAuth — Google / GitHub login
  OAUTH: { freeRequests: 1, timeGapInSec: 10 },

  // OTP sending — strictest, no free requests
  OTP: { freeRequests: 0, timeGapInSec: 60 },

  // Sensitive admin ops — user delete, role change, recover, update-password
  ADMIN: { freeRequests: 1, timeGapInSec: 10 },

  // Logout single session
  LOGOUT: { freeRequests: 2, timeGapInSec: 3 },

  // Logout all devices
  LOGOUT_ALL: { freeRequests: 1, timeGapInSec: 10 },
};

export default THROTTLE_PRESETS;
