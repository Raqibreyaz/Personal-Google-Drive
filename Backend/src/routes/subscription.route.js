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

router.post(
  "/events",
  express.json({
    verify(req, res, buf) {
      req.rawBody = buf.toString("utf-8");
    },
  }),
  razorpayWebhook,
);

router.use(express.json());

router.post("/", checkAuthentication, createSubscription);

router.get("/", checkAuthentication, getSubscription);

router.put("/cancel", checkAuthentication, cancelSubscription);

router.put("/update", checkAuthentication, updateSubscription);

export default router;
