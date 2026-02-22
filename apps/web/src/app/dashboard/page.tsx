import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@han/database";
import Link from "next/link";
import {
  MessageSquare,
  DollarSign,
  CheckCircle,
  Users,
  ArrowRight,
} from "lucide-react";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className="bg-sky-50 rounded-lg p-2.5">
        <Icon className="h-5 w-5 text-sky-500" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, pct, color = "bg-sky-500" }: { label: string; pct: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-400 font-mono">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  // Get business
  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
  });

  if (!business) redirect("/dashboard/onboarding");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [chatsToday, activeConvs, weekUsage, recentConvs] = await Promise.all([
    db.conversation.count({ where: { businessId: business.id, createdAt: { gte: today } } }),
    db.conversation.count({ where: { businessId: business.id, status: "active" } }),
    db.aiUsage.findMany({ where: { businessId: business.id, createdAt: { gte: weekAgo } } }),
    db.conversation.findMany({
      where: { businessId: business.id, status: "active" },
      include: {
        customer: { select: { name: true, phoneNumber: true, usesPidgin: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  // Compute stats
  const totalCostUsd = weekUsage.reduce((s, r) => s + Number(r.costUsd), 0);
  const avgCostPerChat = chatsToday > 0 ? totalCostUsd / (chatsToday || 1) : 0;
  const avgCostNgn = avgCostPerChat * 1600; // rough USD→NGN

  const cacheHits = weekUsage.filter((r) => r.cacheHit).length;
  const faqHits = weekUsage.filter((r) => r.faqMatched).length;
  const haikuCalls = weekUsage.filter((r) => r.model.includes("haiku")).length;
  const total = weekUsage.length;
  const haikuPct = total > 0 ? Math.round((haikuCalls / total) * 100) : 0;
  const sonnetPct = total > 0 ? 100 - haikuPct : 0;
  const cacheRate = total > 0 ? Math.round(((cacheHits + faqHits) / (total + faqHits)) * 100) : 0;

  const resolvedCount = await db.conversation.count({
    where: { businessId: business.id, status: "resolved", updatedAt: { gte: weekAgo } },
  });
  const weekConvTotal = await db.conversation.count({
    where: { businessId: business.id, createdAt: { gte: weekAgo } },
  });
  const resolvedPct = weekConvTotal > 0 ? Math.round((resolvedCount / weekConvTotal) * 100) : 0;

  // Greeting based on time (WAT = UTC+1)
  const hour = new Date().getUTCHours() + 1;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Phone masking helper
  const maskPhone = (p: string) => p.replace(/(\d{4})\d{3}(\d{4})/, "$1***$2");

  // Time diff helper
  const timeAgo = (d: Date) => {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s what Han is doing for {business.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Chats today" value={String(chatsToday)} icon={MessageSquare} />
        <StatCard
          label="Avg cost / chat"
          value={avgCostNgn > 0 ? `₦${avgCostNgn.toFixed(2)}` : "₦0.00"}
          sub="this week"
          icon={DollarSign}
        />
        <StatCard
          label="Resolved by AI"
          value={`${resolvedPct}%`}
          sub="last 7 days"
          icon={CheckCircle}
        />
        <StatCard
          label="Active chats"
          value={String(activeConvs)}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Health */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">AI Health · 7 days</h2>
          <div className="space-y-4">
            <ProgressBar label="⚡ Haiku" pct={haikuPct} color="bg-sky-400" />
            <ProgressBar label="🧠 Sonnet" pct={sonnetPct} color="bg-violet-500" />
            <ProgressBar label="Cache / FAQ hit rate" pct={cacheRate} color="bg-emerald-500" />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Higher Haiku % = lower cost per chat
          </p>
        </div>

        {/* Live Conversations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Live Conversations</h2>
            <Link
              href="/dashboard/conversations"
              className="text-xs text-sky-500 hover:text-sky-600 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentConvs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No active conversations yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Share your WhatsApp number with customers to get started
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentConvs.map((conv) => {
                const lastMsg = conv.messages[0];
                const phone = conv.customer.phoneNumber;
                return (
                  <li key={conv.id}>
                    <Link
                      href={`/dashboard/conversations/${conv.id}`}
                      className="flex items-start gap-3 hover:bg-slate-50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      {/* Green WhatsApp dot */}
                      <div className="mt-1 flex-shrink-0 h-2 w-2 rounded-full bg-[#25D366]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800">
                            {conv.customer.name ?? maskPhone(phone)}
                          </span>
                          {conv.customer.usesPidgin && (
                            <span className="text-xs">🇳🇬</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {lastMsg?.content ?? "No messages yet"}
                        </p>
                      </div>
                      {lastMsg && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {timeAgo(lastMsg.createdAt)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
