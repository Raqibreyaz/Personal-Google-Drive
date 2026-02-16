import ApiError from "../utils/apiError.js";

export const checkAdmin = (req, res, next) => {
  const { user } = req.session;
  if (user.role === "Admin") return next();
  throw new ApiError(403, "You are not Authorized for this action!");
};

export const checkAdminOrManager = async (req, res, next) => {
  const { user } = req.session;
  if (user.role === "Admin" || user.role === "Manager") return next();
  throw new ApiError(403, "You are not Authorized for this action!");
};
