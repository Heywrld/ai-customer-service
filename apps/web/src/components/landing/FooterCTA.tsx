"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { AnimatedSection } from "./AnimatedSection";

export function FooterCTA() {
  return (
    <>
      {/* Final CTA section */}
      <section className="relative bg-slate-950 py-28 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-sky-500/8 rounded-full blur-3xl" />
        </div>

        <AnimatedSection className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl han-gradient flex items-center justify-center han-glow">
              <Image
                src="/icons/han-icon-white.svg"
                alt="Han"
                width={36}
                height={36}
              />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Set up in 10 minutes.
            <br />
            <span className="han-gradient-text">No developers needed.</span>
          </h2>

          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Your customers are sending WhatsApp messages right now.
            Let Han answer them.
          </p>

          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl han-gradient text-white font-semibold text-base hover:opacity-90 transition-all duration-200 han-glow-strong"
          >
            Start free — 14 days, no card needed
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/han-icon-primary.svg"
              alt="Han"
              width={22}
              height={22}
            />
            <span className="text-slate-400 text-sm font-medium">Han</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>

          <p className="text-slate-700 text-sm">
            © {new Date().getFullYear()} Han. Built for Nigeria.
          </p>
        </div>
      </footer>
    </>
  );
}
