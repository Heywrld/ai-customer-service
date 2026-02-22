"use client";

import { motion } from "framer-motion";
import { StaggerContainer, staggerItem } from "./AnimatedSection";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import { FiZap, FiDollarSign, FiUsers, FiMessageSquare } from "react-icons/fi";
import { NG } from "country-flag-icons/react/3x2";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: <FaWhatsapp className="text-[#25D366] text-xl" />,
    title: "WhatsApp AI",
    description:
      "Plugs into your existing WhatsApp Business number. Customers message you — Han replies instantly, 24/7. No new apps needed.",
    badge: "Chat",
  },
  {
    icon: <FaPhone className="text-sky-400 text-xl" />,
    title: "AI Voice Calls",
    description:
      "Han answers your business phone calls automatically. Understands spoken Nigerian English and Pidgin, responds naturally in real-time.",
    badge: "Voice",
  },
  {
    icon: <NG className="w-6 h-4 rounded-sm" title="Nigeria" />,
    title: "Speaks Pidgin",
    description:
      "Automatically detects Pidgin and responds in kind. Customers talk the way they naturally talk — Han keeps up.",
  },
  {
    icon: <FiZap className="text-yellow-400 text-xl" />,
    title: "Always on, 24/7",
    description:
      "Never misses a message or a call. No lunch breaks, no slow replies. Every customer gets a response within seconds.",
  },
  {
    icon: <FiDollarSign className="text-emerald-400 text-xl" />,
    title: "₦0.18 per conversation",
    description:
      "Seven built-in cost optimizations keep AI costs below ₦0.20 per chat. A human agent costs ₦15,000/month minimum.",
  },
  {
    icon: <FiUsers className="text-purple-400 text-xl" />,
    title: "Human takeover",
    description:
      "See every conversation and call live. Jump in anytime. Han hands off seamlessly so customers never notice the switch.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-slate-950 py-28 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <StaggerContainer className="text-center mb-16">
          <motion.p
            variants={staggerItem}
            className="text-sky-400 text-sm font-medium uppercase tracking-widest mb-4"
          >
            Features
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Messages. Calls. Handled.
            <br />
            <span className="han-gradient-text">Automatically.</span>
          </motion.h2>
        </StaggerContainer>

        {/* Feature grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group relative p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-sky-500/20 transition-colors duration-300"
            >
              {/* Channel badge */}
              {feature.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-white/5">
                  {feature.badge}
                </span>
              )}

              <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>

              <h3 className="text-white font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
