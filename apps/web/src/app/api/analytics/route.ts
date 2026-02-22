import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/analytics?period=7 (days)
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "No business" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const period = parseInt(searchParams.get("period") ?? "7");
  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [usageRows, convToday, convTotal, customers] = await Promise.all([
    db.aiUsage.findMany({
      where: { businessId: business.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
    db.conversation.count({
      where: {
        businessId: business.id,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    db.conversation.count({ where: { businessId: business.id } }),
    db.customer.count({ where: { businessId: business.id } }),
  ]);

  // Aggregate stats
  const totalInputTokens = usageRows.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = usageRows.reduce((s, r) => s + r.outputTokens, 0);
  const totalCostUsd = usageRows.reduce((s, r) => s + Number(r.costUsd), 0);
  const cacheHits = usageRows.filter((r) => r.cacheHit).length;
  const faqHits = usageRows.filter((r) => r.faqMatched).length;
  const haikuCalls = usageRows.filter((r) => r.model.includes("haiku")).length;
  const sonnetCalls = usageRows.filter((r) => r.model.includes("sonnet")).length;
  const totalCalls = haikuCalls + sonnetCalls;

  // Resolved count in period
  const resolvedCount = await db.conversation.count({
    where: {
      businessId: business.id,
      status: "resolved",
      updatedAt: { gte: since },
    },
  });
  const periodConvCount = await db.conversation.count({
    where: { businessId: business.id, createdAt: { gte: since } },
  });

  // Daily breakdown for chart
  const dailyMap: Record<string, { conversations: number; costUsd: number }> = {};
  for (let d = 0; d < period; d++) {
    const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    dailyMap[key] = { conversations: 0, costUsd: 0 };
  }
  for (const row of usageRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].conversations++;
      dailyMap[key].costUsd += Number(row.costUsd);
    }
  }
  const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    period,
    chatsToday: convToday,
    totalConversations: convTotal,
    totalCustomers: customers,
    resolvedRate: periodConvCount > 0 ? Math.round((resolvedCount / periodConvCount) * 100) : 0,
    totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
    totalInputTokens,
    totalOutputTokens,
    cacheHitRate: totalCalls > 0 ? Math.round((cacheHits / (totalCalls + cacheHits)) * 100) : 0,
    faqMatchRate: (totalCalls + faqHits) > 0
      ? Math.round((faqHits / (totalCalls + faqHits)) * 100)
      : 0,
    haikuPct: totalCalls > 0 ? Math.round((haikuCalls / totalCalls) * 100) : 0,
    sonnetPct: totalCalls > 0 ? Math.round((sonnetCalls / totalCalls) * 100) : 0,
    daily,
  });
}
