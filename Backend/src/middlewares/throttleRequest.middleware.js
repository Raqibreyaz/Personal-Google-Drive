import redisClient from "../config/redis.js";
import THROTTLE_PRESETS, { userKeyGenerator } from "../config/throttlePresets.js";

const MAX_THROTTLE_DELAY_MS = parseInt(
  process.env.MAX_THROTTLE_DELAY_MS || 10000,
);

/**
 * Throttle middleware — accepts a preset name and optional overrides.
 *
 * Usage:
 *   throttleRequest("READ")
 *   throttleRequest("OTP", { keyGenerator: ipOnlyKeyGenerator })
 *
 * @param {string} presetName  — key into THROTTLE_PRESETS
 * @param {object} [options]
 * @param {function} [options.keyGenerator] — (req) => string, defaults to userKeyGenerator
 */
const throttleRequest = (presetName, options = {}) => {
  const preset = THROTTLE_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown throttle preset: "${presetName}"`);
  }

  const { freeRequests, timeGapInSec } = preset;
  const keyGenerator = options.keyGenerator || userKeyGenerator;

  return async (req, res, next) => {
    const throttleKey = `throttle:${keyGenerator(req)}`;
    const currentTime = Date.now();

    try {
      const data = await redisClient.hGetAll(throttleKey);
      const doesExist = Object.keys(data).length > 0;

      const remainingFreeRequests = doesExist
        ? parseInt(data.freeRequests)
        : freeRequests;
      const lastTime = doesExist ? parseInt(data.lastTime) : currentTime;
      const timePassed = currentTime - lastTime;

      // Allow immediately when:
      //   - first request ever (no key in Redis)
      //   - free requests still available
      //   - enough time has passed since last request
      if (
        !doesExist ||
        remainingFreeRequests > 0 ||
        timePassed >= timeGapInSec * 1000
      ) {
        await redisClient
          .multi()
          .hSet(throttleKey, {
            lastTime: String(currentTime),
            freeRequests: String(
              timePassed >= timeGapInSec * 1000
                ? Math.max(freeRequests - 1, 0)
                : Math.max(remainingFreeRequests - 1, 0),
            ),
          })
          .expire(throttleKey, 10 * 60)
          .exec();

        return next();
      }

      // Compute how long the caller would need to wait
      const delay = timeGapInSec * 1000 - timePassed;
      const retryAfterSec = Math.ceil(delay / 1000);

      // If the delay is too long, reject immediately with 429
      if (delay > MAX_THROTTLE_DELAY_MS) {
        res.set("Retry-After", String(retryAfterSec));
        return res.status(429).json({
          error: `Too many requests. Please try again after ${retryAfterSec} seconds.`,
          retryAfter: retryAfterSec,
        });
      }

      // Otherwise, delay the request and inform the client
      res.set("Retry-After", String(retryAfterSec));

      // Update last request execution time to current time + delay
      await redisClient.hSet(
        throttleKey,
        "lastTime",
        String(currentTime + delay),
      );

      setTimeout(() => {
        next();
      }, delay);
    } catch (error) {
      // On Redis failure, let the request through (fail-open)
      console.error("Throttle middleware error:", error);
      next();
    }
  };
};

export default throttleRequest;
