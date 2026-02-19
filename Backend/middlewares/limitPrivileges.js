import ApiError from "../utils/apiError.js";
import Role from "../utils/role.js";
import User from "../models/userModel.js";

const Limits = Object.freeze(
  Object.values(Role).reduce((acc, role, index) => {
    acc[role] = index;
    return acc;
  }, {}),
);

export default async function limitPrivileges(req, res, next) {
  const { id } = req.params;
  const { user } = req.session;
  const role = req.body?.role;

  const receivedUser = await User.findById(id).lean();

  // allow only when current user has lesser privilege limits than given role
  // (jis role se karna hai + jis role par karna hai) current user role ke under ho
  // whichever role from + whichever role to, all should be under current user's role
  if (
    Limits[user.role] < Limits[receivedUser.role] &&
    (!role || Limits[user.role] < Limits[role])
  ) {
    return next();
  }

  throw new ApiError(403, "You are not Authorized for this action!");
}
