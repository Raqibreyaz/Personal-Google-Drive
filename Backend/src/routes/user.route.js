import express from "express";
import allowOnlyTo from "../middlewares/roleBasedAuth.middleware.js";
import limitPrivileges from "../middlewares/limitPrivileges.middleware.js";
import validateId from "../middlewares/validateId.middleware.js";
import Role from "../constants/role.js";
import {
  getUser,
  deleteUser,
  getAllUsers,
  logoutUser,
  forceLogout,
  logoutUserFromAllDevices,
  recoverUser,
  changeUserRole,
} from "../controllers/user.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  deleteUserSchema,
  changeUserRoleSchema,
} from "../validators/user.validator.js";
import {
  readLimiter,
  mutateLimiter,
  adminLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";

const router = express.Router();

router.param("userId", validateId);

// only authenticated users will be allowed
router.get(
  "/",
  readLimiter,
  throttleRequest("READ"),
  getUser,
);

// allow only authenticated users to logout
router.post(
  "/logout",
  mutateLimiter,
  throttleRequest("LOGOUT"),
  logoutUser,
);
router.post(
  "/logout/all",
  mutateLimiter,
  throttleRequest("LOGOUT_ALL"),
  logoutUserFromAllDevices,
);

// only non-regular users will be allowed
router.get(
  "/all",
  readLimiter,
  throttleRequest("READ"),
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  getAllUsers,
);

// only owner and admin will be allowed to delete user
// only can delete users which are under them
router.delete(
  "/:userId",
  adminLimiter,
  validate(deleteUserSchema),
  throttleRequest("ADMIN"),
  allowOnlyTo([Role.OWNER, Role.ADMIN]),
  limitPrivileges,
  deleteUser,
);

// only non-regular users will be allowed
// only can logout users which are under them
router.post(
  "/logout/:userId",
  adminLimiter,
  throttleRequest("ADMIN"),
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  limitPrivileges,
  forceLogout,
);

router.patch(
  "/recover/:userId",
  adminLimiter,
  throttleRequest("ADMIN"),
  allowOnlyTo([Role.OWNER]),
  recoverUser,
);

// only non-regular users will go forward
// a user can only change role for which he is allowed
router.patch(
  "/role/:userId",
  adminLimiter,
  validate(changeUserRoleSchema),
  throttleRequest("ADMIN"),
  allowOnlyTo([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  limitPrivileges,
  changeUserRole,
);

export default router;
