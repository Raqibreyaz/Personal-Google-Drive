import Razorpay from "razorpay";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const rzp = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

export const createSubscription = (planId, totalCount, planKey, customerEmail) => {
  return rzp.subscriptions.create({
    plan_id: planId,
    customer_notify: true,
    quantity: 1,
    total_count: totalCount,
    notes: {
      plan: planKey,
      customerEmail,
    },
  });
};

export const cancelSubscription = (subscriptionId, cancelAtPeriodEnd) => {
  return rzp.subscriptions.cancel(subscriptionId, cancelAtPeriodEnd);
};

export const updateSubscription = (subscriptionId, planId) => {
  return rzp.subscriptions.update(subscriptionId, {
    plan_id: planId,
    customer_notify: true,
    schedule_change_at: "now",
  });
};

export const verifyWebhookSignature = (bodyString, signature, secret) => {
  return Razorpay.validateWebhookSignature(bodyString, signature, secret);
};

const handleActivatedSubscription = async (context, session) => {
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: {
        status: "active",
        currentPeriodStart: context.currentPeriodStart,
        currentPeriodEnd: context.currentPeriodEnd,
        paymentMethod: context.paymentMethod,
      },
    },
    { session },
  );
  await User.updateOne(
    { _id: context.userId },
    {
      $set: {
        maxStorageInBytes: context.plan.storageQuotaBytes,
        subscription: context.storedSubscriptionId,
      },
    },
    { session },
  );
};

const handleChargedSubscription = async (context, session) => {
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: {
        status: "active",
        currentPeriodStart: context.currentPeriodStart,
        currentPeriodEnd: context.currentPeriodEnd,
      },
    },
    { session },
  );
};

const handlePendingSubscription = async (context, session) => {
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: { status: "past_due" },
    },
    { session },
  );
};

const handleHaltedSubscription = async (context, session) => {
  const threeDaysLater = Date.now() + 1000 * 3 * 86400;
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: {
        status: "in_grace",
        graceEndsAt: new Date(threeDaysLater),
      },
    },
    { session },
  );
};

const handlePausedSubscription = async (context, session) => {
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: { status: "paused" },
    },
    { session },
  );
};

const handleResumedSubscription = async (context, session) => {
  await Subscription.updateOne(
    { razorpaySubscriptionId: context.razorpaySubscriptionId },
    {
      $set: { status: "active" },
    },
    { session },
  );
};

const handleUpdatedSubscription = async (context, session) => {
  if (context.status === "active" && context.planId !== context.storedPlanId) {
    await Subscription.updateOne(
      { razorpaySubscriptionId: context.razorpaySubscriptionId },
      {
        $set: {
          planId: context.planId,
          currentPeriodStart: context.currentPeriodStart,
          currentPeriodEnd: context.currentPeriodEnd,
          billingCycle: context.plan.billingCycle,
        },
      },
      { session },
    );
    await User.updateOne(
      { _id: context.userId },
      {
        $set: {
          maxStorageInBytes: context.plan.storageQuotaBytes,
          subscription: context.storedSubscriptionId,
        },
      },
      { session },
    );
  }
};

const handleCancelledSubscription = async (context, session) => {};

const webhookHandlers = {
  "subscription.activated": handleActivatedSubscription,
  "subscription.charged": handleChargedSubscription,
  "subscription.pending": handlePendingSubscription,
  "subscription.halted": handleHaltedSubscription,
  "subscription.paused": handlePausedSubscription,
  "subscription.resumed": handleResumedSubscription,
  "subscription.updated": handleUpdatedSubscription,
  "subscription.cancelled": handleCancelledSubscription,
};

export const processWebhookEvent = async (eventType, context, session) => {
  const handler = webhookHandlers[eventType];
  if (handler) {
    await handler(context, session);
  }
};
