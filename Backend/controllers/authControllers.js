import crypto from "crypto";
import ApiError from "../utils/apiError.js";
import sendOtpService from "../utils/sendOtpService.js";
import createCookie from "../utils/createCookie.js";

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

export const authGithubSetCookie = (req, res) => {
  if (!req.body) throw new ApiError(400, "No data received!");
  const { sid } = req.body;
  createCookie(res, sid);
  res.status(200).end();
};

export const me = (req, res) => {
  res.status(200).end();
};
