import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FaArrowLeft,
    FaCheck,
    FaCloud,
    FaShieldAlt,
    FaBolt,
    FaInfinity,
    FaCrown,
    FaArrowUp,
    FaArrowDown,
    FaCreditCard,
} from "react-icons/fa";
import { createSubscription, getPlans, getSubscription, updateSubscription } from "./api/plan.js";

const PLAN_FEATURES = {
    Free: [
        "100 MB Storage",
        "Basic file management",
        "File sharing",
        "Community support",
    ],
    Basic: [
        "2 TB Storage",
        "Priority file management",
        "Advanced sharing controls",
        "Email support",
        "File versioning",
    ],
    Standard: [
        "5 TB Storage",
        "Team collaboration",
        "Advanced access controls",
        "Priority support",
        "File versioning",
        "Activity audit logs",
    ],
    Pro: [
        "10 TB Storage",
        "Unlimited collaborators",
        "Admin dashboard",
        "24/7 dedicated support",
        "Advanced analytics",
        "Custom integrations",
        "SLA guarantee",
    ],
};

const PLAN_ICONS = {
    Free: FaCloud,
    Basic: FaShieldAlt,
    Standard: FaBolt,
    Pro: FaCrown,
};

const PLAN_COLORS = {
    Free: {
        gradient: "from-slate-500 to-slate-700",
        accent: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        btn: "bg-slate-600 hover:bg-slate-700",
        ring: "ring-slate-200",
        badge: "bg-slate-100 text-slate-700",
    },
    Basic: {
        gradient: "from-blue-500 to-blue-700",
        accent: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        btn: "bg-blue-600 hover:bg-blue-700",
        ring: "ring-blue-200",
        badge: "bg-blue-100 text-blue-700",
    },
    Standard: {
        gradient: "from-violet-500 to-purple-700",
        accent: "text-violet-600",
        bg: "bg-violet-50",
        border: "border-violet-200",
        btn: "bg-violet-600 hover:bg-violet-700",
        ring: "ring-violet-200",
        badge: "bg-violet-100 text-violet-700",
    },
    Pro: {
        gradient: "from-amber-500 to-orange-600",
        accent: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        btn: "bg-amber-600 hover:bg-amber-700",
        ring: "ring-amber-200",
        badge: "bg-amber-100 text-amber-700",
    },
};

function formatPrice(paise) {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function getYearlySavings(plan) {
    const monthlyVariant = plan.variants?.monthly;
    const yearlyVariant = plan.variants?.yearly;
    if (!monthlyVariant || !yearlyVariant) return null;

    const monthlyAnnualized = monthlyVariant.priceInPaise * 12;
    const yearlyPrice = yearlyVariant.priceInPaise;
    const savings = monthlyAnnualized - yearlyPrice;
    if (savings <= 0) return null;
    return Math.round((savings / monthlyAnnualized) * 100);
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────
function PlanCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-20 bg-gray-200 rounded mb-6" />
            <div className="h-10 w-full bg-gray-200 rounded-lg mb-6" />
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded-full" />
                        <div className="h-4 w-full bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Plan Card ──────────────────────────────────────────────────────────────
function PlanCard({ plan, isYearly, isPopular, currentSubscription, onPostPayment }) {
    console.log('plan', plan)
    console.log('subscription', currentSubscription)
    const name = plan.displayName;
    const colors = PLAN_COLORS[name] || PLAN_COLORS.Free;
    const Icon = PLAN_ICONS[name] || FaCloud;
    const features = PLAN_FEATURES[name] || [];
    const isFree = !!plan.variants?.free;
    const navigate = useNavigate();

    const activeVariant = isFree
        ? plan.variants.free
        : isYearly
            ? plan.variants.yearly
            : plan.variants.monthly;

    const price = activeVariant?.priceInPaise ?? 0;
    const savingsPercent = getYearlySavings(plan);

    const currentPlanKey = currentSubscription?.planKey;
    
    const isGraceExpired = currentSubscription?.graceEndsAt && new Date(currentSubscription.graceEndsAt) <= new Date();
    const isEffectivelyFree = 
        !currentSubscription?.status || 
        (currentSubscription.status === "cancelled" && (!currentSubscription.cancelAtPeriodEnd || isGraceExpired));

    const isCurrentPlan = currentPlanKey && activeVariant?.planKey === currentPlanKey && !isEffectivelyFree;
    const hasActiveSubscription =
        currentSubscription?.status === "active" && currentPlanKey !== "free" && !isEffectivelyFree;
    const isNonCard = currentSubscription?.paymentMethod && currentSubscription.paymentMethod !== "card";
    const isPendingCancellation = currentSubscription?.status === "cancelled" && !isEffectivelyFree;

    // Determine button label and action
    const getButtonConfig = () => {
        if (isCurrentPlan) {
            return { label: "Current Plan", disabled: true, action: null, variant: "current" };
        }
        if (isPendingCancellation) {
            return { label: "Unavailable", disabled: true, action: null, variant: "disabled" };
        }
        if (isFree) {
            if (hasActiveSubscription) {
                return { label: "Free Plan", disabled: true, action: null, variant: "disabled" };
            }
            return { label: "Get Started", disabled: false, action: "navigate", variant: "default" };
        }
        if (hasActiveSubscription) {
            if (isNonCard) {
                return {
                    label: "Can't Change (Non-card)",
                    disabled: true,
                    action: null,
                    variant: "disabled",
                };
            }
            // Compare storage to decide upgrade vs downgrade
            const currentStorage = currentSubscription.storageQuotaBytes || 0;
            const isUpgrade = plan.storageBytes > currentStorage || activeVariant.priceInPaise > currentSubscription.priceInPaise;
            return {
                label: isUpgrade ? "Upgrade" : "Downgrade",
                disabled: false,
                action: "update",
                variant: isUpgrade ? "upgrade" : "downgrade",
            };
        }
        return { label: "Subscribe", disabled: false, action: "subscribe", variant: "default" };
    };

    const buttonConfig = getButtonConfig();

    const subscriptionMutation = useMutation({
        mutationKey: ["subscribe"],
        mutationFn: createSubscription,
    });

    const updateMutation = useMutation({
        mutationKey: ["updateSubscription"],
        mutationFn: updateSubscription,
        onSuccess: () => {
            onPostPayment?.();
            navigate("/dashboard");
        },
    });

    const onSubscribe = async () => {
        if (!window.Razorpay) {
            alert("Razorpay SDK is still loading. Please try again in a moment.");
            return;
        }

        const {
            apiKey, subscriptionId, businessName, theme, prefill, notes
        } =
            await subscriptionMutation.mutateAsync(activeVariant.planKey)

        const options = {
            "key": apiKey,
            "subscription_id": subscriptionId,
            "name": businessName,
            "handler": function (response) {
                console.log(response.razorpay_payment_id);
                console.log(response.razorpay_subscription_id);
                console.log(response.razorpay_signature);
                onPostPayment?.();
                navigate("/dashboard");
            },
            "prefill": prefill,
            "notes": notes,
            "theme": theme
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
    };

    const handleButtonClick = () => {
        if (buttonConfig.action === "subscribe") {
            onSubscribe();
        } else if (buttonConfig.action === "update") {
            if (confirm(`Are you sure you want to ${buttonConfig.label.toLowerCase()} to the ${name} plan?`)) {
                updateMutation.mutate(activeVariant.planKey);
            }
        } else if (buttonConfig.action === "navigate") {
            navigate("/");
        }
    };

    const isButtonLoading = subscriptionMutation.isPending || updateMutation.isPending;

    return (
        <div
            className={`relative bg-white rounded-2xl border ${isCurrentPlan
                ? `${colors.border} ring-2 ring-emerald-300`
                : isPopular
                    ? `${colors.border} ring-2 ${colors.ring}`
                    : "border-gray-200"
                } p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
        >
            {/* Current Plan badge */}
            {isCurrentPlan && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 text-xs font-bold
                        px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                >
                    ✓ Current Plan
                </div>
            )}

            {/* Popular badge (only if not current) */}
            {isPopular && !isCurrentPlan && (
                <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 ${colors.badge} text-xs font-bold 
            px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap`}
                >
                    Most Popular
                </div>
            )}

            {/* Icon */}
            <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center 
          justify-center text-white text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
                <Icon />
            </div>

            {/* Name + Storage */}
            <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
            <p className={`text-sm font-medium ${colors.accent} mb-4`}>
                {plan.storage}
            </p>

            {/* Price */}
            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                        {isFree ? "Free" : formatPrice(price)}
                    </span>
                    {!isFree && (
                        <span className="text-sm text-gray-500">
                            /{isYearly ? "year" : "month"}
                        </span>
                    )}
                </div>
                {!isFree && isYearly && savingsPercent && (
                    <span className="inline-block mt-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Save {savingsPercent}%
                    </span>
                )}
            </div>

            {/* CTA Button */}
            <button
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm mb-6 flex items-center justify-center gap-2 ${isCurrentPlan
                    ? "bg-emerald-100 text-emerald-700 cursor-default"
                    : buttonConfig.disabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : `text-white ${colors.btn} cursor-pointer hover:shadow-md`
                    }`}
                onClick={handleButtonClick}
                disabled={buttonConfig.disabled || isButtonLoading}
            >
                {isButtonLoading ? (
                    "Processing..."
                ) : (
                    <>
                        {buttonConfig.variant === "upgrade" && <FaArrowUp className="text-xs" />}
                        {buttonConfig.variant === "downgrade" && <FaArrowDown className="text-xs" />}
                        {buttonConfig.label}
                    </>
                )}
            </button>

            {/* Update error */}
            {updateMutation.isError && (
                <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                    {updateMutation.error?.message || "Failed to update plan."}
                </div>
            )}

            {/* Feature list */}
            <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    What's included
                </p>
                <ul className="space-y-2.5">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <FaCheck className={`${colors.accent} text-xs mt-1 shrink-0`} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// ─── Plans Page ─────────────────────────────────────────────────────────────
const Plans = () => {
    const [isYearly, setIsYearly] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: plansData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["plans"],
        queryFn: getPlans,
        staleTime: 10 * 60 * 1000,
    });

    const {
        data: subscriptionData,
    } = useQuery({
        queryKey: ["subscription"],
        queryFn: getSubscription,
        staleTime: 2 * 60 * 1000,
    });

    const plans = plansData?.plans ?? [];
    const currentSubscription = subscriptionData?.subscription ?? null;

    const isGraceExpired = currentSubscription?.graceEndsAt && new Date(currentSubscription.graceEndsAt) <= new Date();
    const isEffectivelyFree = 
        !currentSubscription?.status || 
        (currentSubscription.status === "cancelled" && (!currentSubscription.cancelAtPeriodEnd || isGraceExpired));

    const handlePostPayment = () => {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    };

    useEffect(() => {
        let script = document.querySelector("#checkout-script")

        if (!script) {
            script = document.createElement('script')
            script.id = "checkout-script"
            script.src = "https://checkout.razorpay.com/v1/checkout.js"
            script.async = true
            document.body.appendChild(script)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
                <button
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors 
            bg-transparent border-none cursor-pointer text-sm font-medium"
                    onClick={() => navigate("/")}
                >
                    <FaArrowLeft className="text-xs" />
                    Back to Drive
                </button>
            </header>

            {/* Hero section */}
            <section className="max-w-3xl mx-auto text-center px-4 pt-4 pb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                    Choose your{" "}
                    <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
                        perfect plan
                    </span>
                </h1>
                <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                    Secure cloud storage for all your files. Start free and scale as you
                    grow — no surprises, cancel anytime.
                </p>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <span
                        className={`text-sm font-semibold transition-colors ${!isYearly ? "text-gray-900" : "text-gray-400"}`}
                    >
                        Monthly
                    </span>
                    <button
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer border-none ${isYearly ? "bg-violet-600" : "bg-gray-300"}`}
                        onClick={() => setIsYearly(!isYearly)}
                        aria-label="Toggle billing cycle"
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform 
                duration-300 ${isYearly ? "translate-x-7" : "translate-x-0"}`}
                        />
                    </button>
                    <span
                        className={`text-sm font-semibold transition-colors ${isYearly ? "text-gray-900" : "text-gray-400"}`}
                    >
                        Yearly
                    </span>
                    {isYearly && (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full animate-bounce">
                            Save up to 19%
                        </span>
                    )}
                </div>

                {/* Card payment tip */}
                <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1.5">
                    <FaCreditCard className="text-gray-400" />
                    Pay with a card to enable plan upgrades/downgrades later.
                </p>
            </section>

            {/* Plans Grid */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
                {/* Current plan info banner */}
                {currentSubscription && currentSubscription.planKey !== "free" && !isEffectivelyFree && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 mb-6 flex items-center justify-between max-w-2xl mx-auto">
                        <p className="text-sm text-violet-800">
                            You're on the <span className="font-bold">{currentSubscription.planName}</span> plan
                            {currentSubscription.status === "cancelled" && currentSubscription.cancelAtPeriodEnd && (
                                <span className="text-amber-700"> (cancels at period end)</span>
                            )}
                        </p>
                        <button
                            className="text-xs font-semibold text-violet-600 hover:underline cursor-pointer bg-transparent border-none"
                            onClick={() => navigate("/dashboard")}
                        >
                            Manage →
                        </button>
                    </div>
                )}

                {/* Non-card limitation banner */}
                {currentSubscription && currentSubscription.paymentMethod && currentSubscription.paymentMethod !== "card" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 max-w-2xl mx-auto">
                        <FaCreditCard className="text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-semibold">Plan changes unavailable:</span> Your subscription was paid via a non-card method.
                            To upgrade or downgrade, cancel your current plan and re-subscribe with a card.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-700 py-3 px-5 rounded-xl mb-6 text-sm text-center max-w-md mx-auto">
                        {error.message || "Failed to load plans. Please try again."}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading
                        ? [...Array(4)].map((_, i) => <PlanCardSkeleton key={i} />)
                        : plans.map((plan) => (
                            <PlanCard
                                key={plan.displayName}
                                plan={plan}
                                isYearly={isYearly}
                                isPopular={plan.displayName === "Standard"}
                                currentSubscription={currentSubscription}
                                onPostPayment={handlePostPayment}
                            />
                        ))}
                </div>
            </section>

            {/* Footer trust section */}
            <section className="max-w-4xl mx-auto px-4 pb-16">
                <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <FaShieldAlt />
                        <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaInfinity />
                        <span>No hidden fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaBolt />
                        <span>Instant activation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaCloud />
                        <span>Cancel anytime</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Plans;