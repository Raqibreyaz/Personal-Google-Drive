import express from "express";
import { getPlans } from "../controllers/plan.controller.js";
import { readLimiter } from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";

const router = express.Router();

router.get("/", readLimiter, throttleRequest("READ"), getPlans);

export default router;
