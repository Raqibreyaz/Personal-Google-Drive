import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.js";

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

export const otpLimiter = rateLimit({
  windowMs: otpRateLimitWindow * 60 * 1000,
  limit: otpRateLimit,
  message: {
    error: `Too many OTP requests, try again after ${otpRateLimitWindow} minutes`,
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
  }),
  // uses default IP-based key generator (IPv6-safe)
});

export const authLimiter = rateLimit({
  windowMs: authRateLimitWindow * 60 * 1000,
  limit: authRateLimit,
  message: {
    error: `Too many auth attempts, try again after ${authRateLimitWindow} minutes`,
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
  }),
  // uses default IP-based key generator (IPv6-safe)
});

export const writeLimiter = rateLimit({
  windowMs: writeRateLimitWindow * 60 * 1000,
  limit: writeRateLimit,
  message: {
    error: `Too many requests, try again after ${writeRateLimitWindow} minutes`,
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
  }),
  keyGenerator: (req) => req.session?.user._id.toString() || ipKeyGenerator(req.ip),
});

export const readLimiter = rateLimit({
  windowMs: readRateLimitWindow * 60 * 1000,
  limit: readRateLimit,
  message: {
    error: `Too many requests, try again after ${readRateLimitWindow} minutes`,
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args.map(String)),
  }),
  keyGenerator: (req) => req.session?.user._id.toString() || ipKeyGenerator(req.ip),
});
