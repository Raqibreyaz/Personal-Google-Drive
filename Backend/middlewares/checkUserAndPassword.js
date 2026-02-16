import User from "../models/userModel.js";

export default async function checkUserAndPassword(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and Password are required!");

  const user = await User.findOne({ email, isDeleted: false }).select(
    "+password",
  );
  console.log(user);
  const isPasswordValid = user ? await user.comparePassword(password) : false;

  if (!user || !isPasswordValid)
    return res.status(400).json({
      error: "Invalid Credentials",
      message: "Either user not exists or wrong password provided!",
    });

  req.user = user;

  next();
}
