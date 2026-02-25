import crypto from "crypto";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import ApiError from "../helpers/apiError.js";
import createCookie from "../helpers/createCookie.js";
import verifyIdToken from "../services/google.service.js";
import createUserWithEssentials from "../services/user.service.js";
import sendOtpService from "../services/otp.service.js";
import Role from "../constants/role.js";
import Provider from "../constants/provider.js";

export const registerUser = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { name, password, email } = req.body;
  if (!name || !password || !email)
    throw new ApiError(400, "Name,Password and Email all are Required!");

  const { userId, sessionId } = await createUserWithEssentials({
    name,
    email,
    password,
    role: Role.USER,
    authProvider: Provider.LOCAL,
  });

  createCookie(res, sessionId);
  res.status(200).json({ message: "User registered!" });
};

export const loginUser = async (req, res, next) => {
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is Required!");

  const user = await User.findOne({ email }).select("_id").lean();

  // first check if user hasn't exhausted number of sessions limits
  const noOfSessions = await Session.countDocuments({ user: user._id });
  if (noOfSessions >= 2) {
    await Session.findOneAndDelete(
      { user: user._id },
      { sort: { expiresAt: 1 } },
    );
    // throw new ApiError(400, "No of Sessions Exceeded!");
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
  if (!req.body) throw new ApiError(400, "No data received!");

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
      );

    // when user got soft deleted
    if (userDoc.isDeleted)
      throw new ApiError(
        500,
        "Your account is flagged as deleted, Contact App Owner for further details!",
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
    throw new ApiError(401, "Invalid OAuth state");
  }
  res.clearCookie("oauth_state");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    code,
  });

  const tokenRes = await fetch(
    `https://github.com/login/oauth/access_token?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );
  const { access_token } = await tokenRes.json();

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const { id: githubId, name, avatar_url } = await userRes.json();
  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const emails = await emailsRes.json();
  const primaryEmail = emails.find(({ primary }) => primary)?.email;

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
        500,
        "Your account is flagged as deleted, Contact App Owner for further details!",
      );

    if (user.providerId !== String(githubId))
      throw new ApiError(
        400,
        `User already exists as a ${user.authProvider} user`,
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
  if (!req.body) throw new ApiError(400, "No data received!");

  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required!");

  const result = await sendOtpService(email);
  res.status(200).json(result);
};

export const githubAuth = async (req, res, next) => {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const redirect_uri = process.env.GITHUB_REDIRECT_URI;
  const github_scope = process.env.GITHUB_SCOPE;
  const state = crypto.randomBytes(32).toString("hex");

  // Store state in signed cookie (or Redis)
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "strict",
    signed: true,
    secure: true,
  });

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    scope: github_scope,
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};