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
import checkNotUserAndSendOTPSchema from "../validators/checkNotUserAndSendOTP.validator.js";
import checkUserAndSendOTPSchema from "../validators/checkUserAndSendOTP.validator.js";
import verifyOTPAndRegisterSchema from "../validators/verifyOTPAndRegister.validator.js";
import verifyOTPAndLoginSchema from "../validators/verifyOTPAndLogin.validator.js";
import googleLoginSchema from "../validators/googleLogin.validator.js";
import githubLoginSchema from "../validators/githubLogin.validator.js";

const router = express.Router();

// OTP routes
router.post(
  "/register/send-otp",
  validate(checkNotUserAndSendOTPSchema),
  checkUserNotExist,
  sendOtp,
);
router.post(
  "/login/send-otp",
  validate(checkUserAndSendOTPSchema),
  checkUserAndPassword,
  sendOtp,
);

// user must verify otp before registering/logging-in
router.post(
  "/register",
  validate(verifyOTPAndRegisterSchema),
  verifyOtp,
  registerUser,
);
router.post("/login", validate(verifyOTPAndLoginSchema), verifyOtp, loginUser);

// 3rd party login
router.post("/login/google", validate(googleLoginSchema), loginWithGoogle);
router.get("/github", githubAuth);
router.get("/login/github", validate(githubLoginSchema), loginWithGithub);

export default router;
