import crypto from "node:crypto";
import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.cookies?.authToken ?? "";
  let user = null;

  if (authToken) {
    const { secretKey } = req;
    const [payload, hashedSecretKey] = Buffer.from(authToken, "base64url")
      .toString()
      .split(".");

    console.log(payload);

    const { id, expiry } = JSON.parse(payload);
    const ourHashedKey = crypto
      .createHash("sha256")
      .update(secretKey)
      .update(payload)
      .digest("hex");

    console.log(id, expiry);
    console.log("clients hashed key", hashedSecretKey);
    console.log("our hashed key", ourHashedKey);

    const currentTime = Date.now() / 1000;
    const daysPast = (currentTime - expiry) / 86400;

    console.log(daysPast);

    if (daysPast < 7 && ourHashedKey === hashedSecretKey)
      user = await User.findById(id);
  }

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user;

  next();
};

export default checkAuthentication;
