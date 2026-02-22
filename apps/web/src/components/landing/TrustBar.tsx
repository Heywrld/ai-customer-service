"use client";

import { FaWhatsapp, FaPhone, FaCreditCard } from "react-icons/fa";
import { FiBell, FiPackage, FiZap } from "react-icons/fi";
import { NG } from "country-flag-icons/react/3x2";

const signals = [
  {
    label: "Speaks Pidgin",
    icon: <NG className="w-5 h-4 rounded-sm object-cover" title="Nigeria" />,
  },
  {
    label: "WhatsApp & Calls",
    icon: (
      <span className="flex items-center gap-1">
        <FaWhatsapp className="text-[#25D366] text-base" />
        <FaPhone className="text-slate-400 text-xs" />
      </span>
    ),
  },
  {
    label: "Paystack Ready",
    icon: <FaCreditCard className="text-sky-400 text-base" />,
  },
  {
    label: "Lagos to Abuja",
    icon: <FiPackage className="text-slate-400 text-base" />,
  },
  {
    label: "24/7 Always On",
    icon: <FiZap className="text-yellow-400 text-base" />,
  },
];

export function TrustBar() {
  return (
    <div className="bg-slate-950 border-y border-white/5 py-4">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {signals.map((signal, i) => (
            <div key={signal.label} className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center">{signal.icon}</span>
                <span>{signal.label}</span>
                <span className="text-sky-500 text-xs">✓</span>
              </div>
              {i < signals.length - 1 && (
                <div className="hidden sm:block w-px h-4 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
