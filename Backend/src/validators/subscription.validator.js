import { z } from "zod";
import { PLAN_KEYS } from "../config/plans.js";

export const createOrUpdateSubscriptionSchema = z.object({
  body: z.object({
    planKey: z.enum(Object.values(PLAN_KEYS)),
  }),
});

export const cancelSubscriptionSchema = z.object({
  body: z.object({
    cancelAtPeriodEnd: z.boolean(),
  }),
});
