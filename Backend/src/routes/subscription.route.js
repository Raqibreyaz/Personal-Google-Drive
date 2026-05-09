import express from "express";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  razorpayWebhook,
  updateSubscription,
} from "../controllers/subscription.controller.js";
import checkAuthentication from "../middlewares/authenticate.middleware.js";
import {
  mutateLimiter,
  readLimiter,
  uploadLimiter,
} from "../middlewares/rateLimiter.middleware.js";
import throttleRequest from "../middlewares/throttleRequest.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  cancelSubscriptionSchema,
  createOrUpdateSubscriptionSchema,
} from "../validators/subscription.validator.js";

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

router.post(
  "/",
  uploadLimiter,
  validate(createOrUpdateSubscriptionSchema),
  throttleRequest("WRITE"),
  checkAuthentication,
  createSubscription,
);

router.get(
  "/",
  readLimiter,
  throttleRequest("READ"),
  checkAuthentication,
  getSubscription,
);

router.put(
  "/cancel",
  mutateLimiter,
  validate(cancelSubscriptionSchema),
  throttleRequest("MUTATE"),
  checkAuthentication,
  cancelSubscription,
);

router.put(
  "/update",
  mutateLimiter,
  validate(createOrUpdateSubscriptionSchema),
  throttleRequest("MUTATE"),
  checkAuthentication,
  updateSubscription,
);

export default router;
