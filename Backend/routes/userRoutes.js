import express from "express";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
  logoutUserFromAllDevices,
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/", checkAuthentication, getUser);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logout", checkAuthentication, logoutUser);

router.post("/logout/all", checkAuthentication, logoutUserFromAllDevices);

export default router;
