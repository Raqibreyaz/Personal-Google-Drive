import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";

// ─── Env-driven configuration ────────────────────────────────────────────────
const otpRateLimitWindow = parseInt(process.env.OTP_RATE_LIMIT_WINDOW || 15);
const otpRateLimit = parseInt(process.env.OTP_RATE_LIMIT || 5);

const authRateLimitWindow = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || 15);
const authRateLimit = parseInt(process.env.AUTH_RATE_LIMIT || 10);

const writeRateLimitWindow = parseInt(
  process.env.WRITE_RATE_LIMIT_WINDOW || 15,
);
const writeRateLimit = parseInt(process.env.WRITE_RATE_LIMIT || 30);

const readRateLimitWindow = parseInt(process.env.READ_RATE_LIMIT_WINDOW || 15);
const readRateLimit = parseInt(process.env.READ_RATE_LIMIT || 100);

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Creates a rate limiter with sensible defaults + Redis store.
 * @param {object} opts
 * @param {number} opts.windowMin   — window length in minutes
 * @param {number} opts.limit       — max requests per window
 * @param {string} opts.errorMsg    — message shown to the user on 429
 * @param {function} [opts.keyGenerator] — custom key generator (defaults to IP)
 */
function createLimiter({ windowMin, limit, errorMsg, keyGenerator }) {
  return rateLimit({
    windowMs: windowMin * 60 * 1000,
    limit,
    standardHeaders: "draft-7", // sends RateLimit-* and Retry-After headers
    legacyHeaders: false, // disable X-RateLimit-* headers
    message: { error: errorMsg, errorCode: "RATE_LIMITED" },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
    }),
    ...(keyGenerator && { keyGenerator }),
  });
}

// ─── Key generator for authenticated users ───────────────────────────────────
const userKeyGen = (req) =>
  req.session?.user._id.toString() || ipKeyGenerator(req.ip);

// ─── Exported limiters ───────────────────────────────────────────────────────
export const otpLimiter = createLimiter({
  windowMin: otpRateLimitWindow,
  limit: otpRateLimit,
  errorMsg: `Too many OTP requests, try again after ${otpRateLimitWindow} minutes`,
});

export const authLimiter = createLimiter({
  windowMin: authRateLimitWindow,
  limit: authRateLimit,
  errorMsg: `Too many auth attempts, try again after ${authRateLimitWindow} minutes`,
});

export const writeLimiter = createLimiter({
  windowMin: writeRateLimitWindow,
  limit: writeRateLimit,
  errorMsg: `Too many requests, try again after ${writeRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});

export const readLimiter = createLimiter({
  windowMin: readRateLimitWindow,
  limit: readRateLimit,
  errorMsg: `Too many requests, try again after ${readRateLimitWindow} minutes`,
  keyGenerator: userKeyGen,
});
