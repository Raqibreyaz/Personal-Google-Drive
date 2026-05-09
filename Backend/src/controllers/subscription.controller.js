import {
  getPlanByKey,
  getPlanByRazorpayPlanId,
  getTotalBillingCycles,
  PLAN_KEYS,
  PLANS,
} from "../config/plans.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import Directory from "../models/directory.model.js";
import ApiError from "../helpers/apiError.js";
import WebhookEvent from "../models/webhookEvent.model.js";
import formatSize from "../helpers/formatSize.js";
import mongoose from "mongoose";
import * as razorpayService from "../services/razorpay.service.js";

export const createSubscription = async (req, res) => {
  const user = req.session.user;
  const { planKey } = req.body;

  const plan = getPlanByKey(planKey);
  const totalBillingCycles = getTotalBillingCycles(planKey);

  const fetchedSubscription = user.subscription
    ? await Subscription.findById(user.subscription)
    : null;

  let razorpaySubscriptionId = null;
  const createNewSubscription =
    !fetchedSubscription ||
    (fetchedSubscription.status === "cancelled" &&
      (!fetchedSubscription.cancelAtPeriodEnd ||
        fetchedSubscription.graceEndsAt <= new Date()));

  const isAwaitingActivation =
    fetchedSubscription && fetchedSubscription.status === "awaiting_activation";

  // TODO: Make these both Ops atomic
  if (createNewSubscription) {
    const razorpaySubscription = await razorpayService.createSubscription(
      plan.razorpayPlanId,
      totalBillingCycles,
      plan.planKey,
      user.email,
    );

    await Subscription.updateOne(
      { user: user._id },
      {
        $set: {
          razorpaySubscriptionId: razorpaySubscription.id,
          billingCycle: plan.billingCycle,
          status: "awaiting_activation",
          planId: plan.razorpayPlanId,
          cancelAtPeriodEnd: false,
          graceEndsAt: null,
        },
      },
      { upsert: true },
    );

    razorpaySubscriptionId = razorpaySubscription.id;
  } else if (isAwaitingActivation) {
    razorpaySubscriptionId = fetchedSubscription.razorpaySubscriptionId;
  } else throw new ApiError(400, "you are already subscribed!");

  res.json({
    apiKey: process.env.RZP_KEY_ID,
    subscriptionId: razorpaySubscriptionId,
    businessName: "Storra",
    theme: {
      color: "#F37254",
    },
    prefill: {
      name: user.name,
      email: user.email,
      // contact: "9876543211", //TODO: give user's actual contact
    },
    notes: {
      plan: plan.planKey,
      userName: user.name,
    },
    message: "To upgrade/dowgrade subscription later, pay only with cards!",
  });
};

export const getSubscription = async (req, res) => {
  const subscriptionId = req.session.user.subscription;
  if (!subscriptionId) {
    const freePlan = getPlanByKey(PLAN_KEYS.FREE);
    return res.json({
      message: "success!",
      subscription: {
        planKey: freePlan.planKey,
        planName: freePlan.displayName,
        storageQuotaBytes: freePlan.storageQuotaBytes,
      },
    });
  }

  const subscription = await Subscription.findById(subscriptionId)
    .select("-user")
    .lean();
  if (!subscriptionId)
    return res.json({ message: "success!", subscription: null });

  const plan = getPlanByRazorpayPlanId(subscription.planId);

  const data = {
    planKey: plan.planKey,
    planName: plan.displayName,
    billingCycle: subscription.billingCycle,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    nextBillingDate: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    storageQuotaBytes: plan.storageQuotaBytes,
    paymentMethod: subscription.paymentMethod,
    graceEndsAt: subscription.graceEndsAt,
    priceInPaise: plan.priceInPaise,
  };

  res.json({
    message: "success!",
    subscription: data,
  });
};

export const cancelSubscription = async (req, res) => {
  const subscriptionId = req.session.user.subscription;
  if (!subscriptionId)
    throw new ApiError(400, "User doesn't have any subscription yet!");

  const cancelAtPeriodEnd = !!req.body?.cancelAtPeriodEnd;

  const subscription = await Subscription.findById(subscriptionId).lean();

  // on immediate cancellation, give a grace expiry of 3 days
  const graceEndsAt = cancelAtPeriodEnd
    ? subscription.currentPeriodEnd
    : new Date(Date.now() + 3 * 86400 * 1000);

  await razorpayService.cancelSubscription(
    subscription.razorpaySubscriptionId,
    cancelAtPeriodEnd,
  );

  await Subscription.updateOne(
    { _id: subscriptionId },
    {
      $set: { cancelAtPeriodEnd, status: "cancelled", graceEndsAt },
    },
  ).lean();

  res.json({
    message: cancelAtPeriodEnd
      ? "subscription will be cancelled on current period's end!"
      : "subscription cancelled!",
  });
};

export const updateSubscription = async (req, res) => {
  const rootDirId = req.session.user.storageDir;

  const { planKey } = req.body;
  const plan = getPlanByKey(planKey);
  if (!plan) throw new ApiError(400, "Invalid Plan Key received!");

  const storedSubscriptionId = req.session.user.subscription;
  if (!storedSubscriptionId)
    throw new ApiError(400, "No subscription exist to be updated!");

  const storedSubscription =
    await Subscription.findById(storedSubscriptionId).lean();

  if (storedSubscription.status !== "active")
    throw new ApiError(400, "Current Subscription must be active to update!");

  if (storedSubscription.planId === plan.razorpayPlanId)
    throw new ApiError(400, "Subscription already active on the chosen plan!");

  if (storedSubscription.paymentMethod !== "card")
    throw new ApiError(
      400,
      "Subscription can't be updated on non-card payments!",
    );

  // user can't downgrade if consumed space is more than chosen plans capacity
  const { size: consumedSpace } = await Directory.findById(rootDirId).lean();
  if (plan.storageQuotaBytes < consumedSpace)
    throw new ApiError(
      400,
      `${formatSize(consumedSpace - plan.storageQuotaBytes)} need to be deleted to downgrade`,
    );

  const result = await razorpayService.updateSubscription(
    storedSubscription.razorpaySubscriptionId,
    plan.razorpayPlanId,
  );

  res.json({
    message: "Plan updated successfully.",
    status: result.status,
  });
};

export const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];

  if (!signature || !eventId || !req.rawBody) return res.sendStatus(400);

  const isValid = razorpayService.verifyWebhookSignature(
    req.rawBody,
    signature,
    process.env.RZP_WEBHOOK_SECRET,
  );

  // send bad status if event is not from razorpay
  if (!isValid) return res.sendStatus(400);

  // skip the event if it is already processed
  const existingEvent = await WebhookEvent.findOne({ eventId }).lean();
  if (existingEvent && existingEvent.processingStatus === "processed")
    return res.sendStatus(200);

  const body = req.body;
  const subscriptionEntity = body.payload?.subscription?.entity;

  // skip if the event is not a subscription event
  if (!subscriptionEntity) {
    return res.sendStatus(200);
  }

  const eventType = body.event;
  const status = subscriptionEntity.status;
  const razorpaySubscriptionId = subscriptionEntity.id;
  const planId = subscriptionEntity.plan_id;
  const paymentMethod = subscriptionEntity.payment_method;

  const currentPeriodStart = subscriptionEntity.current_start
    ? new Date(subscriptionEntity.current_start * 1000)
    : null;
  const currentPeriodEnd = subscriptionEntity.current_end
    ? new Date(subscriptionEntity.current_end * 1000)
    : null;

  const plan = getPlanByRazorpayPlanId(planId);
  if (!plan) return res.sendStatus(200);

  const storedSubscription = await Subscription.findOne({
    razorpaySubscriptionId,
  }).lean();

  // skip if the subscription doesn't exist
  if (!storedSubscription) return res.sendStatus(200);

  const {
    user: userId,
    _id: storedSubscriptionId,
    planId: storedPlanId,
  } = storedSubscription;
  const context = {
    plan,
    userId,
    paymentMethod,
    currentPeriodStart,
    currentPeriodEnd,
    razorpaySubscriptionId,
    storedSubscriptionId,
    status,
    planId,
    storedPlanId,
  };

  console.log("razorpay webhook", {
    eventId,
    eventType,
    planId,
    planKey: plan.planKey,
    razorpaySubscriptionId,
  });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await WebhookEvent.updateOne(
        { eventId },
        {
          $set: {
            eventId,
            eventType,
            planId,
            rawPayload: req.body,
            razorpaySubscriptionId,
            receivedAt: new Date(),
            provider: "razorpay",
            processingStatus: "processing",
          },
        },
        { upsert: true, session },
      );

      // process the event in the corresponding handler
      await razorpayService.processWebhookEvent(eventType, context, session);

      await WebhookEvent.updateOne(
        { eventId },
        { $set: { processingStatus: "processed" } },
        { session },
      );
    });
  } catch (error) {
    await WebhookEvent.updateOne(
      { eventId },
      {
        $set: {
          eventId,
          eventType,
          planId,
          rawPayload: req.body,
          razorpaySubscriptionId,
          receivedAt: new Date(),
          provider: "razorpay",
          processingStatus: "failed",
          error,
        },
      },
      { upsert: true },
    );
    throw error;
  } finally {
    await session.endSession();
  }

  return res.sendStatus(200);
};
