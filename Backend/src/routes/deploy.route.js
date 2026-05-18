import express from "express";
import { githubWebhook } from "../controllers/deploy.controller.js";

const router = express.Router();

router.post(
  "/events",
  express.raw({ type: "application/json" }),
  githubWebhook,
);

export default router;
