import express from "express";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.js";
import {
  loginUser,
  getUser,
  logoutUser,
  logoutUserFromAllDevices,
  registerUser,
  loginWithGoogle,
  loginWithGithub,
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/", checkAuthentication, getUser);

router.post("/register", registerUser);

router.post("/login", checkUserAndPassword, loginUser);

router.post("/login/google", loginWithGoogle);

router.get("/login/github", loginWithGithub);

router.post("/logout", checkAuthentication, logoutUser);

router.post("/logout/all", checkAuthentication, logoutUserFromAllDevices);

export default router;
