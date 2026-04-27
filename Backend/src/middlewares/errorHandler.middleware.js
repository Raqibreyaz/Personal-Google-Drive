import ApiError from "../helpers/apiError.js";
import {
  INVALID_INPUT,
  VALIDATION_FAILED,
  UNKNOWN_ERROR,
} from "../constants/errorCodes.js";

/**
 * Global error handler — catches all errors and sends a consistent JSON response.
 * Shape: { error: "message", errorCode: "CODE" }
 */
export function globalErrorHandler(err, req, res, next) {
  // ── Mongoose CastError (invalid ObjectId, bad type coercion) ──────────
  if (err.name === "CastError") {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
      errorCode: INVALID_INPUT,
    });
  }

  // ── Mongoose ValidationError (schema-level validation failures) ───────
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: messages.join(", "),
      errorCode: VALIDATION_FAILED,
    });
  }

  // ── MongoDB: schema validation error (code 121) ──────────────────────
  if (err.code === 121) {
    return res.status(400).json({
      error: "Invalid Fields!",
      errorCode: VALIDATION_FAILED,
    });
  }

  // ── MongoDB: duplicate key (code 11000) ───────────────────────────────
  if (err.code === 11000) {
    const field =
      Object.keys(err.keyValue || {})[0] ||
      Object.keys(err.keyPattern || {})[0] ||
      "field";

    const collectionMatch = err.errmsg?.match(
      /collection:\s+([^.]+\.)?([^\s]+)/,
    );
    const rawCollection = collectionMatch?.[2] || "record";

    const singularMap = {
      directories: "directory",
      files: "directory",
      fileshares: "fileshare document",
      otps: "otp",
      sessions: "sessions",
      subscriptions: "subscription",
      users: "user",
      webhookevents: "webhookevent",
    };

    const entity =
      singularMap[rawCollection] || rawCollection.replace(/s$/, "");

    return res.status(409).json({
      error: `A ${entity} with this ${field} already exists!`,
      errorCode: INVALID_INPUT,
    });
  }

  // ── Known operational error (ApiError) ────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode,
    });
  }

  // ── Unknown / programmer error — don't leak details ───────────────────
  console.error(err);
  res.status(500).json({
    error: "Something went wrong!",
    errorCode: UNKNOWN_ERROR,
  });
}
