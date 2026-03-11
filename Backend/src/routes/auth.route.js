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
  adminLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import { ipOnlyKeyGenerator } from "../config/throttlePresets.js";
import checkUserExist from "../middlewares/checkUserExist.middleware.js";
import allowLocalUsersOnly from "../middlewares/allowLocalUsersOnly.middleware.js";

const router = express.Router();

// OTP routes
router.post(
  "/register/send-otp",
  otpLimiter,
  validate(checkUserAndSendOTPSchema),
  throttleRequest("OTP", { keyGenerator: ipOnlyKeyGenerator }),
  checkUserNotExist,
  sendOtp,
);
router.post(
  "/login/send-otp",
  otpLimiter,
  validate(checkUserWithPasswordAndSendOTPSchema),
  throttleRequest("OTP", { keyGenerator: ipOnlyKeyGenerator }),
  checkUserAndPassword,
  sendOtp,
);

router.post(
  "/update-password/send-otp",
  otpLimiter,
  validate(checkUserAndSendOTPSchema),
  throttleRequest("OTP", { keyGenerator: ipOnlyKeyGenerator }),
  checkUserExist,
  allowLocalUsersOnly,
  sendOtp,
);

// user must verify otp before registering/logging-in
router.post(
  "/register",
  authLimiter,
  validate(verifyOTPAndRegisterSchema),
  throttleRequest("AUTH", { keyGenerator: ipOnlyKeyGenerator }),
  verifyOtp,
  registerUser,
);
router.post(
  "/login",
  authLimiter,
  validate(verifyOTPAndLoginSchema),
  throttleRequest("AUTH", { keyGenerator: ipOnlyKeyGenerator }),
  verifyOtp,
  loginUser,
);

// 3rd party login
router.post(
  "/login/google",
  authLimiter,
  validate(googleLoginSchema),
  throttleRequest("OAUTH", { keyGenerator: ipOnlyKeyGenerator }),
  loginWithGoogle,
);
router.get(
  "/github",
  authLimiter,
  throttleRequest("OAUTH", { keyGenerator: ipOnlyKeyGenerator }),
  githubAuth,
);
router.get(
  "/login/github",
  authLimiter,
  validate(githubLoginSchema),
  throttleRequest("OAUTH", { keyGenerator: ipOnlyKeyGenerator }),
  loginWithGithub,
);

router.patch(
  "/update-password",
  adminLimiter,
  validate(updatePasswordSchema),
  throttleRequest("ADMIN", { keyGenerator: ipOnlyKeyGenerator }),
  verifyOtp,
  updateUserPassword,
);

export default router;
