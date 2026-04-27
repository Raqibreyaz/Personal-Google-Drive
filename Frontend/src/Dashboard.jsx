import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaCloud,
  FaShieldAlt,
  FaBolt,
  FaCrown,
  FaEnvelope,
  FaUser,
  FaGoogle,
  FaGithub,
  FaExchangeAlt,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaPause,
  FaBan,
  FaHourglassHalf,
  FaCreditCard,
} from "react-icons/fa";
import { getCurrentUser } from "./api/user.js";
import { getSubscription, cancelSubscription } from "./api/plan.js";
import formatSize from "./utils/formatSize.js";
import ProfileImage from "./components/ProfileImage.jsx";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "bg-emerald-100 text-emerald-700",
    icon: FaCheckCircle,
    description: "Your subscription is active and in good standing.",
  },
  awaiting_activation: {
    label: "Awaiting Payment",
    color: "bg-yellow-100 text-yellow-700",
    icon: FaHourglassHalf,
    description: "Complete payment to activate your subscription.",
  },
  past_due: {
    label: "Payment Failed",
    color: "bg-orange-100 text-orange-700",
    icon: FaExclamationTriangle,
    description: "Your payment failed. We're retrying automatically.",
  },
  in_grace: {
    label: "Grace Period",
    color: "bg-red-100 text-red-700",
    icon: FaClock,
    description:
      "Please update your payment method to avoid losing your plan.",
  },
  paused: {
    label: "Paused",
    color: "bg-gray-100 text-gray-600",
    icon: FaPause,
    description: "Your subscription is paused. Uploads are blocked.",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: FaBan,
    description: "Your subscription has been cancelled.",
  },
};

const AUTH_PROVIDER_CONFIG = {
  local: { label: "Email", icon: FaEnvelope, color: "text-gray-600" },
  google: { label: "Google", icon: FaGoogle, color: "text-red-500" },
  github: { label: "GitHub", icon: FaGithub, color: "text-gray-800" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Cancel Confirmation Modal ──────────────────────────────────────────────
function CancelModal({ isOpen, onClose, onConfirm, isPending }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Cancel Subscription
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          How would you like to cancel your subscription? You can cancel
          immediately or let it run until the end of your current billing
          period.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-red-700 font-medium">
            <span className="font-bold">Note:</span> We do not offer refunds for cancelled subscriptions.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800
              font-medium text-sm cursor-pointer hover:bg-amber-100 transition-colors disabled:opacity-50"
            onClick={() => onConfirm(true)}
            disabled={isPending}
          >
            Cancel at end of billing period
          </button>
          <button
            className="w-full py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700
              font-medium text-sm cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-50"
            onClick={() => onConfirm(false)}
            disabled={isPending}
          >
            Cancel immediately
          </button>
          <button
            className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-600
              font-medium text-sm cursor-pointer hover:bg-gray-200 transition-colors border-none"
            onClick={onClose}
            disabled={isPending}
          >
            Keep my subscription
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Card ───────────────────────────────────────────────────────────
function ProfileCard({ user }) {
  const providerConfig =
    AUTH_PROVIDER_CONFIG[user.authProvider] || AUTH_PROVIDER_CONFIG.local;
  const ProviderIcon = providerConfig.icon;
  const storagePercent = user.maxStorageInBytes
    ? Math.min((user.usedStorageInBytes / user.maxStorageInBytes) * 100, 100)
    : 0;

  const storageBarColor =
    storagePercent > 90
      ? "bg-red-500"
      : storagePercent > 70
        ? "bg-amber-500"
        : "bg-blue-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="h-24 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 relative">
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
            {user.picture ? (
              <ProfileImage src={user.picture} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-14 px-6 pb-6">
        {/* Name & Role */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
            {user.role}
          </span>
        </div>

        {/* Auth provider */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
          <ProviderIcon className={`${providerConfig.color}`} />
          <span>Signed in via {providerConfig.label}</span>
        </div>

        {/* Storage usage */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Storage</span>
            <span className="text-xs text-gray-500">
              {formatSize(user.usedStorageInBytes)} of{" "}
              {formatSize(user.maxStorageInBytes)}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${storageBarColor} transition-all duration-500`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {storagePercent.toFixed(1)}% used
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Card ──────────────────────────────────────────────────────
function SubscriptionCard({ subscription, onCancel, cancelPending }) {
  const navigate = useNavigate();
  const isFree = !subscription.status;
  const status = subscription.status || "free";
  const statusConfig = STATUS_CONFIG[status];

  const PLAN_ICONS = {
    Free: FaCloud,
    Basic: FaShieldAlt,
    Standard: FaBolt,
    Pro: FaCrown,
  };
  const PlanIcon = PLAN_ICONS[subscription.planName] || FaCloud;

  const isCancelledAtEnd =
    status === "cancelled" && subscription.cancelAtPeriodEnd;
    
  const isGraceExpired = subscription.graceEndsAt && new Date(subscription.graceEndsAt) <= new Date();
  const isEffectivelyFree = 
    isFree || 
    (status === "cancelled" && (!subscription.cancelAtPeriodEnd || isGraceExpired));

  const showCancelButton =
    !isEffectivelyFree &&
    status !== "cancelled" &&
    status !== "awaiting_activation";

  const isNonCard = subscription.paymentMethod && subscription.paymentMethod !== "card";
  const isPendingCancellation = status === "cancelled" && !isEffectivelyFree;
  const canChangePlan = !isEffectivelyFree && !isPendingCancellation && !isNonCard;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <PlanIcon />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEffectivelyFree && status === "cancelled" ? "Free" : subscription.planName} Plan
              </h3>
              {!isEffectivelyFree && subscription.billingCycle && (
                <p className="text-xs text-gray-500 capitalize">
                  {subscription.billingCycle} billing
                </p>
              )}
            </div>
          </div>

          {/* Status badge */}
          {statusConfig ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusConfig.color}`}
            >
              <statusConfig.icon className="text-[10px]" />
              {isCancelledAtEnd
                ? `Cancels ${formatDate(subscription.currentPeriodEnd)}`
                : statusConfig.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
              <FaCloud className="text-[10px]" />
              Free Plan
            </span>
          )}
        </div>
      </div>

      {/* Status description */}
      {statusConfig && (
        <div
          className={`mx-6 mt-4 p-3 rounded-lg text-sm ${statusConfig.color} bg-opacity-50`}
        >
          {isCancelledAtEnd
            ? `Your subscription will remain active until ${formatDate(subscription.currentPeriodEnd)}, then you'll be moved to the Free plan.`
            : statusConfig.description}
        </div>
      )}

      {/* Details */}
      <div className="px-6 py-5">
        {isEffectivelyFree ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <FaCrown className="text-2xl text-violet-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Upgrade your experience
            </h4>
            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
              Get more storage, advanced features, and priority support with a
              paid plan.
            </p>
            <button
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-white
                font-semibold text-sm cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-none"
              onClick={() => navigate("/plans")}
            >
              View Plans
            </button>
          </div>
        ) : (
          <>
            {/* Billing details grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <DetailItem
                label="Storage Quota"
                value={formatSize(subscription.storageQuotaBytes)}
              />
              <DetailItem
                label="Billing Cycle"
                value={
                  subscription.billingCycle === "yearly"
                    ? "Yearly"
                    : "Monthly"
                }
              />
              <DetailItem
                label="Current Period"
                value={`${formatDate(subscription.currentPeriodStart)} – ${formatDate(subscription.currentPeriodEnd)}`}
              />
              <DetailItem
                label="Next Billing"
                value={
                  isCancelledAtEnd
                    ? "—"
                    : formatDate(subscription.nextBillingDate)
                }
              />
              {subscription.paymentMethod && (
                <DetailItem
                  label="Payment Method"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <FaCreditCard className="text-xs text-gray-400" />
                      <span className="capitalize">{subscription.paymentMethod}</span>
                    </span>
                  }
                />
              )}
            </div>

            {/* Non-card warning */}
            {isNonCard && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <span className="font-semibold">⚠ Non-card payment detected:</span> Plan
                upgrades/downgrades are only supported for card subscriptions.
                To enable plan changes in the future, cancel and re-subscribe
                using a card.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors border ${
                  canChangePlan
                    ? "bg-violet-50 text-violet-700 cursor-pointer hover:bg-violet-100 border-violet-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                }`}
                onClick={() => navigate("/plans")}
                disabled={!canChangePlan}
                title={
                  isPendingCancellation 
                    ? "Plan changes are not allowed while cancellation is pending" 
                    : isNonCard 
                      ? "Plan changes require card subscriptions" 
                      : undefined
                }
              >
                <FaExchangeAlt className="text-xs" />
                Change Plan
              </button>
              {showCancelButton && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600
                    font-medium text-sm cursor-pointer hover:bg-red-100 transition-colors border border-red-200
                    disabled:opacity-50"
                  onClick={onCancel}
                  disabled={cancelPending}
                >
                  <FaTimes className="text-xs" />
                  Cancel Subscription
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: subscriptionData,
    isLoading: subLoading,
    error: subError,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    staleTime: 2 * 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowCancelModal(false);
    },
  });

  const subscription = subscriptionData?.subscription;
  const isLoading = userLoading || subLoading;
  const error = userError || subError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 h-72 animate-pulse" />
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 h-72 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="bg-red-50 text-red-700 py-4 px-6 rounded-xl text-sm max-w-md text-center">
          {error.message || "Something went wrong. Please try again."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors
            bg-transparent border-none cursor-pointer text-sm font-medium"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft className="text-xs" />
          Back to Drive
        </button>
      </header>

      {/* Page title */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Account
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your profile and subscription
        </p>
      </section>

      {/* Cards grid */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Profile — 2 cols */}
          <div className="lg:col-span-2">
            {userData && <ProfileCard user={userData} />}
          </div>

          {/* Subscription — 3 cols */}
          <div className="lg:col-span-3">
            {subscription && (
              <SubscriptionCard
                subscription={subscription}
                onCancel={() => setShowCancelModal(true)}
                cancelPending={cancelMutation.isPending}
              />
            )}

            {/* Cancel error */}
            {cancelMutation.isError && (
              <div className="mt-3 bg-red-50 text-red-700 py-2.5 px-4 rounded-xl text-sm">
                {cancelMutation.error?.message || "Failed to cancel. Please try again."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cancel modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={(cancelAtPeriodEnd) =>
          cancelMutation.mutate(cancelAtPeriodEnd)
        }
        isPending={cancelMutation.isPending}
      />
    </div>
  );
};

export default Dashboard;
