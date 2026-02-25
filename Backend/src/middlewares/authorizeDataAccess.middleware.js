/*
can this logged-in user access another user's account data?
*/

import ApiError from "../helpers/apiError.js";
import Role from "../constants/role.js";

export default async function authorizeDataAccess(req, res, next) {
  const targetUserId = req.params.userId;
  const loggedInUserId = req.session.user._id.toString();
  const loggedInUserRole = req.session.user.role;

  req.targetUserId = targetUserId || loggedInUserId;

  // allow the data owner directly
  if (!targetUserId || targetUserId === loggedInUserId) {
    return next();
  }

  // direct allow app owner
  if (loggedInUserRole === Role.OWNER) {
    return next();
  }

  // direct allow app admin for 'get' access
  if (loggedInUserRole === Role.ADMIN && req.method === "GET") {
    return next();
  }

  throw new ApiError(403, "You are not authorized to access this user's data!");
}
