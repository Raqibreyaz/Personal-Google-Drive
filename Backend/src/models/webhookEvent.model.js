import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  razorpaySubscriptionId: {
    type: String,
    required: true,
  },
  planId: {
    type: String,
    required: true,
  },
  receivedAt: {
    type: Date,
    default: () => new Date(),
  },
  provider: {
    type: String,
    default: "razorpay",
  },
  processingStatus: {
    type: String,
    enum: ["pending", "processed", "failed"],
    default: "pending",
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
export default WebhookEvent;
