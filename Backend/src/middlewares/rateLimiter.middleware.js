import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  // store: ... , // Redis, Memcached, etc. See below.
});

export default limiter;
