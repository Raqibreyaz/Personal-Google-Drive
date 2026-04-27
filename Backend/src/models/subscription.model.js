import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  planId: {
    type: String,
    required: true,
  },
  razorpaySubscriptionId: {
    type: String,
    unique: true,
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "awaiting_activation",
      "active",
      "past_due",
      "in_grace",
      "paused",
      "cancelled",
    ],
    required: true,
  },
  paymentMethod: {
    type: String,
    default: null,
  },
  currentPeriodStart: {
    type: Date,
  },
  currentPeriodEnd: {
    type: Date,
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  graceEndsAt: {
    type: Date,
    default: null,
  },
});

const Subscription = mongoose.model("Subscription", schema);

export default Subscription;
