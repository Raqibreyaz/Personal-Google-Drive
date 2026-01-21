import ApiError from "./apiError.js";
import usersDB from "../usersDB.json" with { type: "json" };

const checkAuthentication = (req, res, next) => {
  const authToken = req.cookies?.authToken;
  const user = authToken ? usersDB.find((user) => user.id === authToken) : null;

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user

  next();
};

export default checkAuthentication