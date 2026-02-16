import express from "express";
import checkAuthentication from "../middlewares/checkAuthentication.js";
import checkUserAndPassword from "../middlewares/checkUserAndPassword.js";
import {
  loginUser,
  getUser,
  deleteUser,
  getAllUsers,
  logoutUser,
  forceLogout,
  logoutUserFromAllDevices,
  registerUser,
  loginWithGoogle,
  loginWithGithub,
} from "../controllers/userControllers.js";
import {
  checkAdmin,
  checkAdminOrManager,
} from "../middlewares/roleBasedAuth.js";

const router = express.Router();

router.get("/", checkAuthentication, getUser);

router.delete("/:id", checkAuthentication, checkAdmin, deleteUser);

router.get("/all", checkAuthentication, checkAdminOrManager, getAllUsers);

router.post("/register", registerUser);

router.post("/login", checkUserAndPassword, loginUser);

router.post("/login/google", loginWithGoogle);

router.get("/login/github", loginWithGithub);

router.post("/logout", checkAuthentication, logoutUser);

router.post("/logout/:id", checkAuthentication, checkAdmin, forceLogout);

router.post("/logout/all", checkAuthentication, logoutUserFromAllDevices);

export default router;
