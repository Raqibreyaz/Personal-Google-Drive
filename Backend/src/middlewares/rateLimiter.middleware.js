import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";

// ─── Env-driven configuration ────────────────────────────────────────────────
const otpRateLimitWindow = parseInt(process.env.OTP_RATE_LIMIT_WINDOW || 15);
const otpRateLimit = parseInt(process.env.OTP_RATE_LIMIT || 5);

const authRateLimitWindow = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || 15);
const authRateLimit = parseInt(process.env.AUTH_RATE_LIMIT || 10);

const uploadRateLimitWindow = parseInt(
  process.env.UPLOAD_RATE_LIMIT_WINDOW || 15,
);
const uploadRateLimit = parseInt(process.env.UPLOAD_RATE_LIMIT || 20);

const mutateRateLimitWindow = parseInt(
  process.env.MUTATE_RATE_LIMIT_WINDOW || 15,
);
const mutateRateLimit = parseInt(process.env.MUTATE_RATE_LIMIT || 40);

const readRateLimitWindow = parseInt(process.env.READ_RATE_LIMIT_WINDOW || 15);
const readRateLimit = parseInt(process.env.READ_RATE_LIMIT || 100);

const adminRateLimitWindow = parseInt(
  process.env.ADMIN_RATE_LIMIT_WINDOW || 15,
);
const adminRateLimit = parseInt(process.env.ADMIN_RATE_LIMIT || 10);

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a rate limiter with sensible defaults + Redis store.
 * @param {object} opts
 * @param {number} opts.windowMin   — window length in minutes
 * @param {number} opts.limit       — max requests per window
 * @param {string} opts.errorMsg    — message shown to the user on 429
 * @param {string} opts.prefix      — unique Redis key prefix for this limiter
 * @param {function} [opts.keyGenerator] — custom key generator (defaults to IP)
 */
function createLimiter({ windowMin, limit, errorMsg, prefix, keyGenerator }) {
  return rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: errorMsg, errorCode: "RATE_LIMITED" },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
      prefix: `rl:${prefix}:`,
    }),
    ...(keyGenerator && { keyGenerator }),
  });
}

// ─── Key generator for authenticated users ───────────────────────────────────
const userKeyGen = (req) =>
  req.session?.user?._id?.toString() || ipKeyGenerator(req.ip);

// ─── Exported limiters ───────────────────────────────────────────────────────

/** OTP sends — strictest (5 req / 15 min per IP) */
export const otpLimiter = createLimiter({
  windowMin: otpRateLimitWindow,
  limit: otpRateLimit,
  prefix: "otp",
  errorMsg: `Too many OTP requests, try again after ${otpRateLimitWindow} minutes`,
});

/** Auth actions — login, register, OAuth (10 req / 15 min per IP) */
export const authLimiter = createLimiter({
  windowMin: authRateLimitWindow,
  limit: authRateLimit,
  prefix: "auth",
  errorMsg: `Too many auth attempts, try again after ${authRateLimitWindow} minutes`,
});

/** File uploads + directory creates (20 req / 15 min per user) */
export const uploadLimiter = createLimiter({
  windowMin: uploadRateLimitWindow,
  limit: uploadRateLimit,
  prefix: "upload",
  errorMsg: `Too many uploads, try again after ${uploadRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});

/** Mutations — rename, delete, share, revoke, set-access (40 req / 15 min per user) */
export const mutateLimiter = createLimiter({
  windowMin: mutateRateLimitWindow,
  limit: mutateRateLimit,
  prefix: "mutate",
  errorMsg: `Too many requests, try again after ${mutateRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});

/** Read operations (100 req / 15 min per user) */
export const readLimiter = createLimiter({
  windowMin: readRateLimitWindow,
  limit: readRateLimit,
  prefix: "read",
  errorMsg: `Too many requests, try again after ${readRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});

/** Admin ops — user delete, role change, recover, force logout (10 req / 15 min per user) */
export const adminLimiter = createLimiter({
  windowMin: adminRateLimitWindow,
  limit: adminRateLimit,
  prefix: "admin",
  errorMsg: `Too many admin actions, try again after ${adminRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});
