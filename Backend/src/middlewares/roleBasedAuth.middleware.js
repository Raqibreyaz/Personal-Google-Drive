import ApiError from "../helpers/apiError.js";

export default function allowOnlyTo(allowedUserRoles) {
  return (req, res, next) => {
    const { user } = req.session;
    if (allowedUserRoles.includes(user.role)) return next();
    throw new ApiError(403, "You are not Authorized for this action!");
  };
}
