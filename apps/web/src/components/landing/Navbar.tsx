"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  const { scrollY } = useScroll();

  // Transition from transparent → frosted glass as user scrolls
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md border-b border-white/5"
        style={{ opacity: bgOpacity }}
      />

      <div className="relative mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Image
              src="/icons/han-icon-primary.svg"
              alt="Han"
              width={28}
              height={28}
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Han
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8">
          {["How it works", "Features", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium px-4 py-2 rounded-lg han-gradient text-white hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
