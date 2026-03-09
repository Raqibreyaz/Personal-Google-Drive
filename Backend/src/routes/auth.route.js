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
  updateUserPassword,
} from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  checkUserAndSendOTPSchema,
  verifyOTPAndRegisterSchema,
  verifyOTPAndLoginSchema,
  googleLoginSchema,
  githubLoginSchema,
  checkUserWithPasswordAndSendOTPSchema,
  updatePasswordSchema,
} from "../validators/auth.validator.js";
import {
  authLimiter,
  otpLimiter,
  writeLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { ipKeyGenerator } from "express-rate-limit";
import checkUserExist from "../middlewares/checkUserExist.middleware.js";
import allowLocalUsersOnly from "../middlewares/allowLocalUsersOnly.middleware.js";

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
  validate(checkUserAndSendOTPSchema),
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
  validate(checkUserWithPasswordAndSendOTPSchema),
  checkUserAndPassword,
  sendOtp,
);

router.post(
  "/update-password/send-otp",
  otpLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 0,
    timeGapInSec: 60,
  }),
  validate(checkUserAndSendOTPSchema),
  checkUserExist,
  allowLocalUsersOnly,
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

router.patch(
  "/update-password",
  writeLimiter,
  throttleRequest({
    throttleKeyGenerator: (req) => ipKeyGenerator(req.ip),
    freeRequests: 0,
    timeGapInSec: 10,
  }),
  validate(updatePasswordSchema),
  verifyOtp,
  updateUserPassword,
);

export default router;
