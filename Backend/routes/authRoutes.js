import express from "express";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.js";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import {
  sendOtp,
  verifyOtp,
  githubAuth,
  authGithubSetCookie,
  me,
} from "../controllers/authControllers.js";

const router = express.Router();

router.get("/me", checkAuthentication, me);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/login/send-otp", checkUserAndPassword, sendOtp);

router.get("/github", githubAuth);

router.post("/github/set-cookie", authGithubSetCookie);

export default router;
