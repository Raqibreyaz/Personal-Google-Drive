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
  recoverUser,
  changeUserRole,
} from "../controllers/userControllers.js";
import allowOnlyTo from "../middlewares/roleBasedAuth.js";
import limitPrivileges from "../utils/limitPrivileges.js";
import Role from "../utils/role.js";

const router = express.Router();

// only authenticated users will be allowed
router.get("/", checkAuthentication, getUser);

router.post("/register", registerUser);

router.post("/login", checkUserAndPassword, loginUser);

router.post("/login/google", loginWithGoogle);

router.get("/login/github", loginWithGithub);

// allow only authenticated users to logout
router.post("/logout", checkAuthentication, logoutUser);

// allow only authenticated users to logout
router.post("/logout/all", checkAuthentication, logoutUserFromAllDevices);

// only owner and admin will be allowed to delete user
// only can delete users which are under them
router.delete(
  "/:id",
  checkAuthentication,
  allowOnlyTo([Role.OWNER, Role.ADMIN]),
  limitPrivileges,
  deleteUser,
);

// only non-regular users will be allowed
router.get(
  "/all",
  checkAuthentication,
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  getAllUsers,
);

// only non-regular users will be allowed
// only can logout users which are under them
router.post(
  "/logout/:id",
  checkAuthentication,
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  limitPrivileges,
  forceLogout,
);

router.patch(
  "/recover/:id",
  checkAuthentication,
  allowOnlyTo([Role.OWNER]),
  recoverUser,
);

// only non-regular users will go forward
// a user can only change role for which he is allowed
router.patch(
  "/role/:id",
  checkAuthentication,
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  limitPrivileges,
  changeUserRole,
);

export default router;
