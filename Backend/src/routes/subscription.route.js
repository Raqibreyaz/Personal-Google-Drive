import express from "express";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  razorpayWebhook,
} from "../controllers/subscription.controller.js";
import checkAuthentication from "../middlewares/authenticate.middleware.js";

const router = express.Router();

router.post("/", checkAuthentication, createSubscription);

router.get("/", checkAuthentication, getSubscription);

router.put("/:id/cancel", checkAuthentication, cancelSubscription);

router.post("/events", razorpayWebhook);

export default router;
