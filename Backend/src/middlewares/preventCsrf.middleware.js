import ApiError from "../helpers/apiError.js";

const ALLOWED_ORIGINS = new Set([process.env.FRONTEND_URI]);

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const preventCsrf = (req, res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  //   const origin = req.get("Origin");
  //   if (!origin || !ALLOWED_ORIGINS.has(origin)) {
  //     throw new ApiError(403, "Untrusted origin");
  //   }

  const csrfHeader = req.get("X-CSRF-Token");
  if (
    csrfHeader ||
    req.url.includes("/subscriptions/events") ||
    req.url.includes("/deploy/events")
  ) {
    return next();
  }

  throw new ApiError(400, "Simple requests not allowed");
};

export default preventCsrf;
