import ApiError from "../helpers/apiError.js";


export default async function verifyUserPassword(req, res, next) {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { password } = req.body;
  if (!password)
    throw new ApiError(400, "Password is required!");

  const user = req.user;

  if (user?.isDeleted)
    throw new ApiError(403, "User Account flagged!");

  const isPasswordValid = user ? await user.comparePassword(password) : false;

  if (!user || !isPasswordValid)
    throw new ApiError(
      401,
      "Either user not exists or wrong password provided!"
    );

  next();
}
