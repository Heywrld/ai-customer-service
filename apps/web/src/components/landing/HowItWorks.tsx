"use client";

import { motion } from "framer-motion";
import { StaggerContainer, staggerItem } from "./AnimatedSection";
import { RemotionPlayer } from "./RemotionPlayer";

const steps = [
  {
    number: "01",
    title: "Customer messages or calls",
    description:
      "Your customer WhatsApps your business number or dials your line — in English, Pidgin, or whatever they're comfortable with.",
    icon: "📲",
  },
  {
    number: "02",
    title: "Han reads and understands",
    description:
      "Han detects the channel and language, understands the intent — whether it's a product query, complaint, or delivery question.",
    icon: "🧠",
  },
  {
    number: "03",
    title: "Instant reply, every time",
    description:
      "A natural, helpful response is sent or spoken within seconds. 24/7. No lunch breaks, no slow replies, no missed calls.",
    icon: "⚡",
  },
  {
    number: "04",
    title: "You see everything",
    description:
      "Every chat and call is logged in your dashboard. Jump in anytime, add FAQs, or hand off to a human agent if needed.",
    icon: "📊",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-950 py-28 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <StaggerContainer className="text-center mb-20">
          <motion.p
            variants={staggerItem}
            className="text-sky-400 text-sm font-medium uppercase tracking-widest mb-4"
          >
            How it works
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Simple for you.
            <br />
            <span className="han-gradient-text">Magic for your customers.</span>
          </motion.h2>
        </StaggerContainer>

        {/* Steps */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={staggerItem}
              className="relative group"
            >
              {/* Connector line between steps (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-sky-500/30 to-transparent z-0 translate-x-0" />
              )}

              <div className="relative z-10 p-6 rounded-2xl bg-slate-900 border border-white/5 h-full group-hover:border-sky-500/20 transition-colors duration-300">
                {/* Number + icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-white/5 font-mono">
                    {step.number}
                  </span>
                  <span className="text-2xl">{step.icon}</span>
                </div>

                <h3 className="text-white font-semibold text-lg mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Remotion product demo video */}
        <div className="max-w-4xl mx-auto">
          <RemotionPlayer />
        </div>
      </div>
    </section>
  );
}
