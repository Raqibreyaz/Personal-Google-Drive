import { apiGet, apiPost, apiPut } from "./client.js";

export const getPlans = () => apiGet("/plans");

export const createSubscription = (planKey) => apiPost("/subscriptions", { planKey });

export const getSubscription = () => apiGet("/subscriptions");

export const cancelSubscription = (cancelAtPeriodEnd) =>
  apiPut("/subscriptions/cancel", { cancelAtPeriodEnd });

export const updateSubscription = (planKey) =>
  apiPut("/subscriptions/update", { planKey });
