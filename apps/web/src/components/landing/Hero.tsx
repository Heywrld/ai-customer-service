"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { FaWhatsapp, FaPhone } from "react-icons/fa";

// ─── Replace this URL once you have a Spline scene built ──────────────────────
// Go to spline.design → create scene → publish → copy the scene URL
const SPLINE_SCENE_URL = ""; // e.g. "https://prod.spline.design/xxx/scene.splinecode"
// ─────────────────────────────────────────────────────────────────────────────

// Lazy-load Spline — it's heavy (~1MB) so we never block initial render
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <HanBarsPlaceholder />,
});

// Animated signal bars — used when no Spline scene is set yet
function HanBarsPlaceholder() {
  const bars = [
    { height: 40, delay: 0 },
    { height: 60, delay: 0.15 },
    { height: 80, delay: 0.3 },
  ];

  return (
    <div className="flex items-end justify-center gap-1.5">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-6 rounded-md"
          style={{
            height: bar.height,
            background: "linear-gradient(180deg, #38BDF8 0%, #06B6D4 100%)",
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.4,
            delay: bar.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Floating glow orbs in the background
function GlowOrbs() {
  return (
    <>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-3xl pointer-events-none" />
    </>
  );
}

export function Hero() {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const hasSplineScene = Boolean(SPLINE_SCENE_URL);

  return (
    <section className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 noise-bg" />

      {/* Glow orbs */}
      <GlowOrbs />

      {/* Spline 3D scene — full background when scene URL is set */}
      {hasSplineScene && (
        <div className="absolute inset-0">
          <Spline
            scene={SPLINE_SCENE_URL}
            onLoad={() => setSplineLoaded(true)}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Grid overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-5xl mx-auto">

        {/* Animated icon / Spline placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-12"
        >
          {hasSplineScene ? (
            // When Spline scene is set, show Han icon as smaller brand mark above text
            <Image
              src="/icons/han-icon-primary.svg"
              alt="Han"
              width={64}
              height={64}
              className="mx-auto"
            />
          ) : (
            // No scene yet — show the animated bars prominently as the hero visual
            <div className="w-40 h-40 flex items-center justify-center mx-auto">
              <div className="scale-[2.5]">
                <HanBarsPlaceholder />
              </div>
            </div>
          )}
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Built for Nigerian businesses
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight"
        >
          Your customers deserve{" "}
          <span className="han-gradient-text">instant answers.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.26 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
        >
          Han answers your WhatsApp messages and phone calls 24/7 — so
          Nigerian businesses never miss a sale. Speaks Pidgin. Understands
          your products. Always online.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.34 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl han-gradient text-white font-semibold text-base hover:opacity-90 transition-all duration-200 han-glow"
          >
            Get started free
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-slate-300 font-medium text-base hover:border-white/20 hover:text-white transition-all duration-200"
          >
            <span className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
              <span className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-slate-300 translate-x-px" />
            </span>
            See it in action
          </a>
        </motion.div>

        {/* Channel pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex items-center gap-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-medium">
            <FaWhatsapp />
            WhatsApp
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <FaPhone className="text-[10px]" />
            Voice Calls
          </span>
          <span className="text-slate-700 text-xs">· No developers needed · Cancel anytime</span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
