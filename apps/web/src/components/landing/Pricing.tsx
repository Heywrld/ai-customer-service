"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StaggerContainer, staggerItem } from "./AnimatedSection";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    naira: "₦15,000",
    usd: "$9",
    period: "/month",
    description: "For small businesses just getting started.",
    conversations: "500 conversations",
    features: [
      "WhatsApp integration",
      "Pidgin language support",
      "Basic FAQ manager",
      "Conversation history",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    naira: "₦45,000",
    usd: "$27",
    period: "/month",
    description: "For growing businesses with steady customer volume.",
    conversations: "2,000 conversations",
    features: [
      "Everything in Starter",
      "Voice call handling",
      "Advanced analytics",
      "Cost optimization dashboard",
      "Priority support",
      "Human takeover",
    ],
    cta: "Start free trial",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Scale",
    naira: "₦120,000",
    usd: "$72",
    period: "/month",
    description: "For high-volume businesses across multiple locations.",
    conversations: "Unlimited",
    features: [
      "Everything in Growth",
      "Multiple WhatsApp numbers",
      "Custom AI persona",
      "Paystack integration",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact us",
    highlighted: false,
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
            Less than one staff member.
            <br />
            <span className="han-gradient-text">Better than ten.</span>
          </motion.h2>
          <motion.p variants={staggerItem} className="text-slate-400 text-lg">
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </StaggerContainer>

        {/* Tier grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
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
