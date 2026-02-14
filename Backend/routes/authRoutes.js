import express from "express";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.js";
import { sendOtp, verifyOtp } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/login/send-otp", checkUserAndPassword, sendOtp);

export default router;
