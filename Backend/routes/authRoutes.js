import express from "express";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.js";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import {
  sendOtp,
  githubAuth,
  me,
} from "../controllers/authControllers.js";
import checkUserNotExist from "../middlewares/checkUserNotExist.js";

const router = express.Router();

router.get("/me", checkAuthentication, me);

router.post("/register/send-otp",checkUserNotExist, sendOtp);

router.post("/login/send-otp", checkUserAndPassword, sendOtp);

router.get("/github", githubAuth);

export default router;
