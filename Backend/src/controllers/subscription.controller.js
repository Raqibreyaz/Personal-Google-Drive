import Razorpay from "razorpay";
import {
  getPlanByKey,
  getPlanByRazorpayPlanId,
  getTotalBillingCycles,
} from "../config/plans.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import ApiError from "../helpers/apiError.js";
import WebhookEvent from "../models/webhookEvent.model.js";

const rzp = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

export const createSubscription = async (req, res) => {
  const user = req.session.user;
  const { planKey } = req.body;

  const plan = getPlanByKey(planKey);
  const totalBillingCycles = getTotalBillingCycles(planKey);

  const fetchedSubscription = user.subscription
    ? await Subscription.findById(user.subscription)
    : null;

  let razorpaySubscriptionId = null;
  // TODO: Make these both Ops atomic
  if (!fetchedSubscription) {
    const razorpaySubscription = await rzp.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: true,
      quantity: 1,
      total_count: totalBillingCycles,
      notes: {
        plan: plan.planKey,
        customerEmail: user.email,
      },
    });
    await Subscription.insertOne({
      razorpaySubscriptionId: razorpaySubscription.id,
      user: user._id,
      billingCycle: plan.billingCycle,
      status: "awaiting_activation",
      planId: plan.razorpayPlanId,
    });

    razorpaySubscriptionId = razorpaySubscription.id;
  } else if (fetchedSubscription.status !== "created")
    throw new ApiError(400, "you are already subscribed!");

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
  });
};

export const getSubscription = async (req, res) => {
  const subscriptionId = req.session.user.subscription;
  if (!subscriptionId)
    return res.json({ message: "success!", subscription: null });

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

  const subscription = await Subscription.findByIdAndUpdate(subscriptionId, {
    $set: {
      cancelAtPeriodEnd: true,
      status: "cancelled",
    },
  }).lean();

  await rzp.subscriptions.cancel(subscription.razorpaySubscriptionId, true);

  res.json({
    message: "subscription will be cancelled on current period's end!",
  });
};

export const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];

  // skip the event if it is already processed
  const existingEvent = await WebhookEvent.findOne({ eventId }).lean();
  if (existingEvent && existingEvent.processingStatus === "processed")
    return res.sendStatus(200);

  const bodyString = JSON.stringify(req.body);
  if (
    Razorpay.validateWebhookSignature(
      bodyString,
      signature,
      process.env.RZP_WEBHOOK_SECRET,
    )
  ) {
    const subscriptionEntity = req.body.payload.subscription.entity;
    const eventType = req.body.event;
    const status = subscriptionEntity.status;
    const razorpaySubscriptionId = subscriptionEntity.id;
    const planId = subscriptionEntity.plan_id;
    const currentPeriodStart = subscriptionEntity.current_start;
    const currentPeriodEnd = subscriptionEntity.current_end;

    const plan = getPlanByRazorpayPlanId(planId);
    const storedSubscription = await Subscription.findOne({
      razorpaySubscriptionId,
    }).lean();

    await WebhookEvent.insertOne({
      eventId,
      eventType,
      planId,
      rawPayload: req.body,
      razorpaySubscriptionId,
      receivedAt: new Date(),
      provider: "razorpay",
      processingStatus: "pending",
    });

    console.log("************");
    console.log("event occured:");
    console.log(planId);
    console.log(plan.planKey);
    console.log(eventType);
    console.log(razorpaySubscriptionId);
    console.log("************");

    switch (eventType) {
      case "subscription.activated":
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: {
              status: "active",
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            },
          },
        );
        await User.updateOne(
          { _id: storedSubscription.user },
          {
            $set: {
              maxStorageInBytes: plan.storageQuotaBytes,
              subscription: storedSubscription._id,
            },
          },
        );
        break;

      case "subscription.charged":
        // update start/end dates on subscription renewal
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: {
              status: "active",
              currentPeriodStart: new Date(currentPeriodStart * 1000),
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            },
          },
        );
        break;

      case "subscription.pending":
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: { status: "past_due" },
          },
        );
        break;

      case "subscription.halted":
        const threeDaysLater = Date.now() + 1000 * 3 * 86400;
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: { status: "in_grace", graceEndsAt: new Date(threeDaysLater) },
          },
        );
        break;

      case "subscription.paused":
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: { status: "paused" },
          },
        );
        break;

      case "subscription.resumed":
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: { status: "active" },
          },
        );
        break;

      case "subscription.cancelled":
        await Subscription.updateOne(
          { razorpaySubscriptionId },
          {
            $set: {
              status: "cancelled",
              cancelAtPeriodEnd: true,
              graceEndsAt: storedSubscription.currentPeriodEnd,
            },
          },
        );
        break;

      default:
        break;
    }

    await WebhookEvent.updateOne(
      { eventId },
      { $set: { processingStatus: "processed" } },
    );

    return res.sendStatus(200);
  }

  res.sendStatus(400);
};
