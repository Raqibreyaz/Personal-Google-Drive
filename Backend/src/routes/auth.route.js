import express from "express";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.middleware.js";
import checkUserNotExist from "../middlewares/checkUserNotExist.middleware.js";
import verifyOtp from "../middlewares/verifyOtp.middleware.js";
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  loginWithGithub,
  sendOtp,
  githubAuth,
} from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  checkNotUserAndSendOTPSchema,
  checkUserAndSendOTPSchema,
  verifyOTPAndRegisterSchema,
  verifyOTPAndLoginSchema,
  googleLoginSchema,
  githubLoginSchema,
} from "../validators/auth.validator.js";
import {
  authLimiter,
  otpLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { ipKeyGenerator } from "express-rate-limit";

const router = express.Router();

// OTP routes
router.post(
  "/register/send-otp",
  otpLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 0,
    timeGapInSec: 60,
  }),
  validate(checkNotUserAndSendOTPSchema),
  checkUserNotExist,
  sendOtp,
);
router.post(
  "/login/send-otp",
  otpLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 0,
    timeGapInSec: 60,
  }),
  validate(checkUserAndSendOTPSchema),
  checkUserAndPassword,
  sendOtp,
);

// user must verify otp before registering/logging-in
router.post(
  "/register",
  authLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 1,
    timeGapInSec: 5,
  }),
  validate(verifyOTPAndRegisterSchema),
  verifyOtp,
  registerUser,
);
router.post(
  "/login",
  authLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 1,
    timeGapInSec: 5,
  }),
  validate(verifyOTPAndLoginSchema),
  verifyOtp,
  loginUser,
);

// 3rd party login
router.post(
  "/login/google",
  authLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 1,
    timeGapInSec: 10,
  }),
  validate(googleLoginSchema),
  loginWithGoogle,
);
router.get(
  "/github",
  authLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 1,
    timeGapInSec: 10,
  }),
  githubAuth,
);
router.get(
  "/login/github",
  authLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 1,
    timeGapInSec: 10,
  }),
  validate(githubLoginSchema),
  loginWithGithub,
);

export default router;
