import ApiError from "../utils/apiError.js";
import { ObjectId } from "mongodb";

const checkAuthentication = async (req, res, next) => {
  const authToken = req.cookies?.authToken;
  const db = req.db;
  const userCollection = db.collection("users");

  const user = authToken
    ? await userCollection.findOne({ _id: new ObjectId(authToken) })
    : null;

  if (!authToken || !user) throw new ApiError(400, "Login to use the App!");

  req.user = user;

  next();
};

export default checkAuthentication;
