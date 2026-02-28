"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, Loader2, CheckCircle2 } from "lucide-react";

interface BusinessData {
  plan: string;
  monthlyCallCount: number;
  trialEndsAt: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 35000,
    calls: 300,
    features: [
      "300 AI conversations/month",
      "1 default voice",
      "WhatsApp + Voice",
      "Basic analytics",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 85000,
    calls: 700,
    popular: true,
    features: [
      "700 AI conversations/month",
      "5 curated voices (Amaka, Funke, Chioma…)",
      "WhatsApp + Voice",
      "Full analytics",
      "No Han branding",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 175000,
    calls: 1500,
    features: [
      "1,500 AI conversations/month",
      "All ElevenLabs voices",
      "Priority speed",
      "Full analytics",
      "No Han branding",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 350000,
    calls: Infinity,
    features: [
      "Unlimited conversations",
      "Custom voice clone",
      "Dedicated support",
      "Custom setup",
      "SLA guarantee",
    ],
  },
];

const PLAN_CALL_LIMITS: Record<string, number> = {
  trial: 15,
  starter: 300,
  business: 700,
  pro: 1500,
  enterprise: Infinity,
};

export default function BillingPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded");

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [upgradeError, setUpgradeError] = useState("");

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => setBusiness(d.business))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planId: string) {
    setPaying(planId);
    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setUpgradeError("Payment initialization failed. Please try again.");
    } catch {
      setUpgradeError("Something went wrong. Please try again.");
    } finally {
      setPaying(null);
    }
  }

  const currentPlan = business?.plan ?? "trial";
  const callsUsed = business?.monthlyCallCount ?? 0;
  const callsLimit = PLAN_CALL_LIMITS[currentPlan] ?? 15;
  const usagePct = callsLimit === Infinity ? 0 : Math.min(100, Math.round((callsUsed / callsLimit) * 100));
  const trialDaysLeft = business?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(business.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your Han subscription</p>
      </div>

      {/* Upgrade success banner */}
      {upgraded && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 mb-8">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">You&apos;re on {upgraded}!</p>
            <p className="text-sm text-emerald-700">Payment successful. Your plan has been upgraded.</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      {!loading && business && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">Current plan</p>
              <p className="text-lg font-bold text-slate-900 capitalize">{currentPlan}</p>
            </div>
            {currentPlan === "trial" && (
              <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
                {trialDaysLeft} days left
              </span>
            )}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">Conversations used this month</span>
              <span className="text-slate-700 font-mono font-medium">
                {callsUsed}{callsLimit !== Infinity ? ` / ${callsLimit}` : " / ∞"}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePct > 80 ? "bg-red-400" : usagePct > 50 ? "bg-amber-400" : "bg-emerald-500"
                }`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upgrade error */}
      {upgradeError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-red-700 flex-1">{upgradeError}</p>
          <button onClick={() => setUpgradeError("")} className="text-red-400 hover:text-red-600 text-xs shrink-0">Dismiss</button>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isDowngrade =
            PLANS.findIndex((p) => p.id === currentPlan) >
            PLANS.findIndex((p) => p.id === plan.id);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border flex flex-col ${
                plan.popular
                  ? "border-sky-400 ring-1 ring-sky-400"
                  : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Most popular
                  </span>
                </div>
              )}

              <div className="p-5 flex-1">
                <h3 className="font-bold text-slate-900 mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-slate-900">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-sm">/month</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-5 pb-5">
                {isCurrent ? (
                  <div className="w-full text-center py-2 text-sm font-medium text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!paying || isDowngrade}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDowngrade
                        ? "text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed"
                        : plan.popular
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : "bg-slate-900 hover:bg-slate-700 text-white"
                    }`}
                  >
                    {paying === plan.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                    ) : isDowngrade ? (
                      "Contact us"
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        Payments processed securely by Paystack · Annual plans save 2 months · Cancel anytime
      </p>
    </div>
  );
}
