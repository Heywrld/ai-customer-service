"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StaggerContainer, staggerItem } from "./AnimatedSection";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    naira: "₦35,000",
    usd: "$23",
    period: "/month",
    description: "For small businesses getting started with AI support.",
    conversations: "300 calls/month",
    features: [
      "1 default AI voice",
      "WhatsApp + Voice",
      "Pidgin language support",
      "Basic FAQ manager",
      "Conversation history",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Business",
    naira: "₦85,000",
    usd: "$55",
    period: "/month",
    description: "For growing businesses with steady customer volume.",
    conversations: "700 calls/month",
    features: [
      "Everything in Starter",
      "5 curated AI voices",
      "No Han branding",
      "Advanced analytics",
      "Cost optimization dashboard",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Pro",
    naira: "₦175,000",
    usd: "$113",
    period: "/month",
    description: "For high-volume businesses that demand the best.",
    conversations: "1,500 calls/month",
    features: [
      "Everything in Business",
      "All ElevenLabs voices",
      "Priority response speed",
      "Multiple numbers",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Enterprise",
    naira: "₦350,000",
    usd: "$226",
    period: "/month",
    description: "Your voice. Answering every customer call, 24/7.",
    conversations: "Unlimited calls",
    features: [
      "Everything in Pro",
      "Custom voice clone",
      "Your voice answers calls",
      "Unlimited calls",
      "Custom AI persona",
      "White-glove onboarding",
    ],
    cta: "Contact us",
    highlighted: false,
    badge: "Voice Clone",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-slate-900 py-28 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <StaggerContainer className="text-center mb-16">
          <motion.p
            variants={staggerItem}
            className="text-sky-400 text-sm font-medium uppercase tracking-widest mb-4"
          >
            Pricing
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
          >
            Less than one employee.
            <br />
            <span className="han-gradient-text">Works harder than ten.</span>
          </motion.h2>
          <motion.p variants={staggerItem} className="text-slate-400 text-lg">
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </StaggerContainer>

        {/* Tier grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={staggerItem}
              className={cn(
                "relative flex flex-col rounded-2xl p-7 border transition-all duration-300",
                tier.highlighted
                  ? "bg-gradient-to-b from-sky-500/10 to-slate-900 border-sky-500/30 han-glow"
                  : "bg-slate-950 border-white/5 hover:border-white/10"
              )}
            >
              {/* Popular badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold han-gradient text-white">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {tier.name}
                </h3>
                <p className="text-slate-500 text-sm">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {tier.naira}
                  </span>
                  <span className="text-slate-500 text-sm">{tier.period}</span>
                </div>
                <p className="text-slate-600 text-xs mt-1">
                  ≈ {tier.usd}/mo · {tier.conversations}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 my-5" />

              {/* Features */}
              <ul className="flex-1 space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm text-slate-400"
                  >
                    <span className="text-sky-500 shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/sign-up"
                className={cn(
                  "block text-center py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  tier.highlighted
                    ? "han-gradient text-white hover:opacity-90"
                    : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                )}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Fine print */}
        <p className="text-center text-slate-600 text-sm mt-10">
          Prices shown in NGN. USD equivalent shown for reference.
          Billed monthly. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
