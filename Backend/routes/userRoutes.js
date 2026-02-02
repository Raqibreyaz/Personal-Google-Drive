import express from "express";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/", checkAuthentication, getUser);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logout", checkAuthentication, logoutUser);

export default router;
