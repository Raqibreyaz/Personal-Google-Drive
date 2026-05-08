import ApiError from "../helpers/apiError.js";

export function globalErrorHandler(err, req, res, next) {
  // ── Known operational error (ApiError)
  // These are errors we intentionally throw using new ApiError()
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      errorCode: err.errorCode,
    });
  }

  // Mongoose: Invalid ObjectId or bad type coercion
  if (err.name === "CastError") {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose: Schema validation failures (e.g., required fields missing)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: messages.join(", "),
    });
  }

  // MongoDB: Duplicate key violation (Code 11000)
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
    });
  }

  // ── MongoDB: Strict schema validation error (code 121)
  if (err.code === 121) {
    return res.status(400).json({
      error: "Database validation failed due to invalid fields.",
    });
  }

  // Razorpay Errors, Razorpay API throws errors usually wrapped in a specific object
  // If it's a Razorpay error, send a generic payment failure message
  // Don't leak the exact Razorpay internal description to the client.
  if (err.error && err.error.code) {
    console.log("[Razorpay Error]", err.error);
    return res.status(400).json({
      error: "Payment processing failed. please try again.",
      errorCode: "PAYMENT_FAILED",
    });
  }

  // AWS SDK Errors usually have a name ending in "Error" or specific codes
  if (
    err.name === "NoSuchKey" ||
    err.name === "AccessDenied" ||
    err.$metadata
  ) {
    console.error("[AWS Error]", err);
    return res.status(502).json({
      error:
        "Storage operation failed. Please contact support if this persists.",
    });
  }

  // Redis Errors
  if (err.name === "ReplyError" || err.message?.includes("Redis")) {
    console.error("[Redis Error]", err);
    return res.status(503).json({
      error: "Service temporarily unavailable due to high load.",
    });
  }

  // JSON parsing errors(body parser)
  // Thrown when a client sends malformed JSON in the request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload.",
    });
  }

  // ── Unknown / programmer error — don't leak details ───────────────────
  console.log(err);
  res.status(500).json({
    error: "Something went wrong!",
    errorCode: "UNKNOWN_ERROR",
  });
}
