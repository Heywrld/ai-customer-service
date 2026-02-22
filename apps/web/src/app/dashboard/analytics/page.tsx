import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@han/database";
import { BarChart2, TrendingUp, Zap, DollarSign } from "lucide-react";

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
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
      <div className="bg-sky-50 rounded-lg p-2.5 shrink-0">
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

function Bar({ pct, color = "bg-sky-500" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) redirect("/dashboard/onboarding");

  const period = 30;
  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [usageRows, convTotal, resolvedCount, periodConvCount, customerCount] = await Promise.all([
    db.aiUsage.findMany({ where: { businessId: business.id, createdAt: { gte: since } } }),
    db.conversation.count({ where: { businessId: business.id } }),
    db.conversation.count({
      where: { businessId: business.id, status: "resolved", updatedAt: { gte: since } },
    }),
    db.conversation.count({ where: { businessId: business.id, createdAt: { gte: since } } }),
    db.customer.count({ where: { businessId: business.id } }),
  ]);

  const totalCostUsd = usageRows.reduce((s, r) => s + Number(r.costUsd), 0);
  const totalCostNgn = totalCostUsd * 1600;
  const haikuCalls = usageRows.filter((r) => r.model.includes("haiku")).length;
  const sonnetCalls = usageRows.filter((r) => r.model.includes("sonnet")).length;
  const cacheHits = usageRows.filter((r) => r.cacheHit).length;
  const faqHits = usageRows.filter((r) => r.faqMatched).length;
  const total = usageRows.length;
  const haikuPct = total > 0 ? Math.round((haikuCalls / total) * 100) : 0;
  const cachePct =
    total + faqHits > 0 ? Math.round(((cacheHits + faqHits) / (total + faqHits)) * 100) : 0;
  const resolvedPct =
    periodConvCount > 0 ? Math.round((resolvedCount / periodConvCount) * 100) : 0;

  // Savings estimate: avg human agent ₦60,000/month handling ~500 chats
  const humanAgentCostNgn = 60000;
  const savingsNgn = humanAgentCostNgn - totalCostNgn;

  // Daily data for simple text chart
  const dailyMap: Record<string, number> = {};
  for (let d = 0; d < period; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    dailyMap[date.toISOString().slice(0, 10)] = 0;
  }
  for (const row of usageRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key] !== undefined) dailyMap[key]++;
  }
  const dailyEntries = Object.entries(dailyMap).slice(-14); // last 14 days
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total conversations"
          value={String(convTotal)}
          sub={`${periodConvCount} this month`}
          icon={BarChart2}
        />
        <StatCard
          label="Total customers"
          value={String(customerCount)}
          icon={TrendingUp}
        />
        <StatCard
          label="Resolved by AI"
          value={`${resolvedPct}%`}
          sub="this month"
          icon={Zap}
        />
        <StatCard
          label="AI cost (30 days)"
          value={`₦${totalCostNgn.toFixed(0)}`}
          sub={`$${totalCostUsd.toFixed(4)} USD`}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model split */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Model Usage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">⚡ Haiku (cheap)</span>
                <span className="font-mono text-slate-400">{haikuPct}%</span>
              </div>
              <Bar pct={haikuPct} color="bg-sky-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">🧠 Sonnet (capable)</span>
                <span className="font-mono text-slate-400">{100 - haikuPct}%</span>
              </div>
              <Bar pct={100 - haikuPct} color="bg-violet-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Cache + FAQ hits (₦0)</span>
                <span className="font-mono text-slate-400">{cachePct}%</span>
              </div>
              <Bar pct={cachePct} color="bg-emerald-500" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Haiku: {haikuCalls} calls · Sonnet: {sonnetCalls} calls · FAQ: {faqHits} hits
          </div>
        </div>

        {/* Savings callout */}
        <div className="bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl p-5 text-white">
          <p className="text-sm font-medium opacity-80 mb-2">Han saved you</p>
          <p className="text-4xl font-bold mb-1">
            ₦{Math.max(0, savingsNgn).toLocaleString()}
          </p>
          <p className="text-sm opacity-70 mb-6">vs. a human agent this month</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Human agent (est.)</span>
              <span className="font-mono">₦60,000/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Han AI cost</span>
              <span className="font-mono">₦{totalCostNgn.toFixed(0)}</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
              <span>Savings</span>
              <span className="font-mono">₦{Math.max(0, savingsNgn).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini bar chart — last 14 days */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">AI calls — last 14 days</h2>
        <div className="flex items-end gap-1 h-24">
          {dailyEntries.map(([date, count]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-sky-400 rounded-t transition-all"
                style={{ height: `${(count / maxDaily) * 80}px`, minHeight: count > 0 ? "4px" : "0" }}
              />
              <span className="text-xs text-slate-300 rotate-45 origin-left" style={{ fontSize: "9px" }}>
                {date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
