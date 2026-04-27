import express from "express";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  razorpayWebhook,
  updateSubscription,
} from "../controllers/subscription.controller.js";
import checkAuthentication from "../middlewares/authenticate.middleware.js";

const router = express.Router();

router.post("/", checkAuthentication, createSubscription);

router.get("/", checkAuthentication, getSubscription);

router.put("/cancel", checkAuthentication, cancelSubscription);

router.put("/update", checkAuthentication, updateSubscription);

router.post("/events", razorpayWebhook);

export default router;
