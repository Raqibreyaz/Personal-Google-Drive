import ApiError from "../helpers/apiError.js";

export default function allowLocalUsersOnly(req, res, next) {
  const user = req.user;
  if (user.authProvider === "Local") return next();

  throw new ApiError(400, "Only Local Users are allowed for this action!");
}
