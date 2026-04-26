/*
in_grace, cancelled-with-grace
- both gets a grace period, so on expiry of that, we will demote the user to free plan + notify the user on demotion through email
- before grace expiry , warn users by notifying through email
*/

import cron from "node-cron";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import sendEmail from "./email.service.js";
import { PLANS } from "../config/plans.js";
import formatSize from "../helpers/formatSize.js";
import Directory from "../models/directory.model.js";

const freePlanBytes = PLANS.free.storageQuotaBytes;

// run at every midnight 12 O' clock
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  const expiredSubscriptions = await Subscription.find({
    graceEndsAt: { $lte: now },
    status: { $in: ["in_grace", "cancelled"] },
  })
    .select("_id user")
    .lean();

  // demoting users to free plan whose grace period expired
  for (const { user: userId, _id } of expiredSubscriptions) {
    try {
      const user = await User.findById(userId).lean();

      // update user's available space as free plan
      await User.updateOne(
        { _id: userId },
        { $set: { maxStorageInBytes: freePlanBytes } },
      );

      // grace expiry handled, now remove it
      await Subscription.updateOne(
        { _id },
        {
          $set: { status: "cancelled" },
          $unset: { graceEndsAt: 1, cancelAtPeriodEnd: 1 },
        },
      );

      const rootDir = await Directory.findById(user.storageDir).lean();
      // notify user for subscription demotion
      await sendEmail(
        user.email,
        "Subscription downgraded to free plan",
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
  <h2 style="margin-bottom: 12px;">Your subscription has been downgraded to the free plan</h2>

  <p>Your grace period has ended, and your account is now on the free plan.</p>

  <p>
    You can continue to access and download your files. If your current storage usage is above the free plan limit, new uploads will remain blocked until you:
  </p>

  <ul>
    <li>renew or upgrade your subscription, or</li>
    <li>delete enough files to fit within the free plan limit.</li>
  </ul>

  <p>
    Free plan limit: <strong>${formatSize(freePlanBytes)}</strong><br />
    Your current usage: <strong>${formatSize(rootDir.size)}</strong>
  </p>

  <p style="margin-top: 24px;">— The Storage App Team</p>
</div>`,
      );
    } catch (error) {
      console.log("Cron downgrade failed:", {
        subscriptionId: _id.toString(),
        userId: userId.toString(),
        error,
      });
    }
  }

  // warning users whose grace period is going to expire within 24 hours and they are consuming more than free plan limit
  const graceSubscriptions = await Subscription.find({
    status: { $in: ["in_grace", "cancelled"] },
    graceEndsAt: { $gt: now, $lte: new Date(now.getTime() + 1000 * 86400) },
  }).lean();

  for (const { user: userId, graceEndsAt } of graceSubscriptions) {
    try {
      const user = await User.findById(userId).lean();
      const rootDir = await Directory.findById(user.storageDir).lean();

      // skip if user's consumption is under free plan
      if (rootDir.size <= freePlanBytes) continue;

      await sendEmail(
        user.email,
        "Your plan will move to free soon — please reduce storage or renew",
        `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
  <h2 style="margin-bottom: 12px;">Action needed: your paid plan will end soon</h2>

  <p>Your subscription is currently in its grace period and will move to the free plan soon.</p>

  <p>
    Your current storage usage is above the free plan limit, so after the downgrade you will not be able to upload new files until you either:
  </p>

  <ul>
    <li>renew or upgrade your subscription, or</li>
    <li>delete enough files to come within the free plan limit.</li>
  </ul>

  <p>
    We recommend reviewing your stored files before the grace period ends to avoid upload interruptions.
  </p>

  <p>
    Free plan limit: <strong>${formatSize(freePlanBytes)}</strong><br />
    Your current usage: <strong>${formatSize(rootDir.size)}</strong><br />
    Grace period ends on: <strong>${graceEndsAt.toDateString()}</strong>
  </p>

  <p>
    If you want to continue with your current storage, please renew your plan before the deadline.
  </p>

  <p style="margin-top: 24px;">— The Storage App Team</p>
</div>`,
      );
    } catch (error) {
      console.log("Cron Warning failed:", {
        userId: userId.toString(),
        graceEndsAt,
        error,
      });
    }
  }
});
