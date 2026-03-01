"use client";

import Link from "next/link";

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const message =
    daysLeft === 0
      ? "Your free trial ends today!"
      : `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm shrink-0">
      <span className="text-amber-800 font-medium">⚠ {message} Upgrade to keep Han working for your customers.</span>
      <Link
        href="/dashboard/billing"
        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 whitespace-nowrap"
      >
        Upgrade now
      </Link>
    </div>
  );
}
