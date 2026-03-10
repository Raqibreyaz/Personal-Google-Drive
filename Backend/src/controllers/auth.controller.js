import crypto from "crypto";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import ApiError from "../helpers/apiError.js";
import dataSanitizer from "../helpers/dataSanitizer.js";
import createCookie from "../helpers/createCookie.js";
import verifyIdToken from "../services/google.service.js";
import createUserWithEssentials from "../services/user.service.js";
import sendOtpService from "../services/otp.service.js";
import Role from "../constants/role.js";
import Provider from "../constants/provider.js";
import {
  MISSING_DATA,
  INVALID_INPUT,
  ACCOUNT_DELETED,
  DUPLICATE_USER,
  INVALID_OAUTH_STATE,
  OAUTH_ERROR,
} from "../constants/errorCodes.js";

export const registerUser = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!", MISSING_DATA);

  const sanitizedName = dataSanitizer.sanitize(name);
  if (!sanitizedName || sanitizedName.length !== name.length)
    throw new ApiError(400, "Invalid name of user!", INVALID_INPUT);

  const { userId, sessionId } = await createUserWithEssentials({
    name: sanitizedName,
    email,
    password,
    role: Role.USER,
    authProvider: Provider.LOCAL,
  });

  createCookie(res, sessionId);
  res.status(200).json({ message: "User registered!" });
};

export const loginUser = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is Required!", MISSING_DATA);

  const user = await User.findOne({ email }).select("_id").lean();

  // first check if user hasn't exhausted number of sessions limits
  const noOfSessions = await Session.countDocuments({ user: user._id });
  if (noOfSessions >= 2) {
    await Session.findOneAndDelete(
      { user: user._id },
      { sort: { expiresAt: 1 } },
    );
  }

  // create a new session for the user
  const userSession = await Session.insertOne({
    user: user._id,
    expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
  });

  createCookie(res, userSession.id);
  res.status(200).json({ message: "User logged in!" });
};

export const loginWithGoogle = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { idToken } = req.body;
  const userData = await verifyIdToken(idToken);
  const userDoc = await User.findOne({ email: userData.email });

  // create the user with directory and session
  if (!userDoc) {
    const { userId, sessionId } = await createUserWithEssentials({
      name: userData.name,
      email: userData.email,
      authProvider: Provider.GOOGLE,
      role: Role.USER,
      password: null,
      picture: userData.picture,
      providerId: userData.sub,
    });

    createCookie(res, sessionId);
  }

  // when user exists then create a new session + limit the no of sessions
  if (userDoc) {
    // when user is not a google user
    if (userDoc.providerId !== String(userData.sub))
      throw new ApiError(
        400,
        `User already exists as a ${userDoc.authProvider} user`,
        DUPLICATE_USER,
      );

    // when user got soft deleted
    if (userDoc.isDeleted)
      throw new ApiError(
        403,
        "Your account is flagged as deleted, Contact App Owner for further details!",
        ACCOUNT_DELETED,
      );

    // first check if user hasn't exhausted number of sessions limits
    const noOfSessions = await Session.countDocuments({ user: userDoc._id });
    if (noOfSessions >= 2)
      await Session.findOneAndDelete(
        { user: userDoc._id },
        { sort: { expiresAt: 1 } },
      );

    // create a new session for the user
    const userSession = await Session.insertOne({
      user: userDoc._id,
      expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
    });

    createCookie(res, userSession.id);
  }

  res.status(200).json({ message: "User logged in!" });
};

export const loginWithGithub = async (req, res, next) => {
  const { code, state } = req.query;

  // 1. Validate state (CSRF protection)
  const savedState = req.signedCookies.oauth_state;

  if (!savedState || savedState !== state) {
    throw new ApiError(401, "Invalid OAuth state", INVALID_OAUTH_STATE);
  }
  res.clearCookie("oauth_state");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    code,
  });

  // Wrap GitHub API calls with error handling
  let access_token;
  try {
    const tokenRes = await fetch(
      `https://github.com/login/oauth/access_token?${params.toString()}`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
      },
    );
    const tokenData = await tokenRes.json();
    access_token = tokenData.access_token;
    if (!access_token)
      throw new Error(tokenData.error_description || "Failed to get access token");
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "GitHub authentication failed", OAUTH_ERROR);
  }

  let githubId, name, avatar_url, primaryEmail;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) throw new Error("Failed to fetch GitHub user");
    const userData = await userRes.json();
    githubId = userData.id;
    name = userData.name;
    avatar_url = userData.avatar_url;

    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!emailsRes.ok) throw new Error("Failed to fetch GitHub emails");
    const emails = await emailsRes.json();
    primaryEmail = emails.find(({ primary }) => primary)?.email;
    if (!primaryEmail) throw new Error("No primary email found on GitHub account");
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "Failed to retrieve GitHub profile", OAUTH_ERROR);
  }

  const user = await User.findOne({ email: primaryEmail }).lean();

  if (!user) {
    // create the user with directory and session
    const { userId, sessionId } = await createUserWithEssentials({
      name,
      email: primaryEmail,
      authProvider: Provider.Github,
      role: Role.USER,
      password: null,
      picture: avatar_url,
      providerId: String(githubId),
    });

    createCookie(res, sessionId);
  }

  // when user exists then create a new session + limit the no of sessions
  if (user) {
    if (user.isDeleted)
      throw new ApiError(
        403,
        "Your account is flagged as deleted, Contact App Owner for further details!",
        ACCOUNT_DELETED,
      );

    if (user.providerId !== String(githubId))
      throw new ApiError(
        400,
        `User already exists as a ${user.authProvider} user`,
        DUPLICATE_USER,
      );

    // first check if user hasn't exhausted number of sessions limits
    const noOfSessions = await Session.countDocuments({ user: user._id });
    if (noOfSessions >= 2)
      await Session.findOneAndDelete(
        { user: user._id },
        { sort: { expiresAt: 1 } },
      );

    // create a new session for the user
    const userSession = await Session.insertOne({
      user: user._id,
      expiresAt: new Date((Date.now() / 1000 + 86400) * 1000),
    });

    createCookie(res, userSession.id);
  }

  res.redirect(`${process.env.FRONTEND_URI}/callback`);
};

export const sendOtp = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!", MISSING_DATA);

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!", MISSING_DATA);

  const result = await sendOtpService(email);
  res.status(200).json(result);
};

export const githubAuth = async (req, res, next) => {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const redirect_uri = process.env.GITHUB_REDIRECT_URI;
  const github_scope = process.env.GITHUB_SCOPE;
  const state = crypto.randomBytes(32).toString("hex");

  const domain = process.env.SITE_DOMAIN || ".local.com";

  // Store state in signed cookie (or Redis)
  res.cookie("oauth_state", state, {
    domain,
    httpOnly: true,
    sameSite: "strict",
    signed: true,
  });

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    scope: github_scope,
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const updateUserPassword = async (req, res, next) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully!" });
};
