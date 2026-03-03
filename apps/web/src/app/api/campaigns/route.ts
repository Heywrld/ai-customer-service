import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createHmac } from "crypto";
import { db } from "@han/database";
import { makeCall } from "@han/voice";

function buildTtsUrl(baseUrl: string, text: string, voiceId: string): string {
  const ts = Date.now().toString();
  const t = Buffer.from(text).toString("base64url");
  const sig = createHmac("sha256", process.env.CLERK_SECRET_KEY ?? "han-tts-secret")
    .update(`${t}:${voiceId}:${ts}`)
    .digest("hex");
  const p = Buffer.from(JSON.stringify({ t, v: voiceId, ts, sig })).toString("base64url");
  return `${baseUrl}/api/tts?p=${p}`;
}

// ── GET /api/campaigns — list campaigns (newest first) ───────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ campaigns: [] });

  const campaigns = await db.campaign.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

// ── POST /api/campaigns — create campaign + fire calls ───────────────────────
// body: { message: string, filter: "all" | "inactive_7d" | "inactive_30d" }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (!business.phoneNumber) {
    return NextResponse.json(
      { error: "You need an active Han number before sending campaigns. Upgrade your plan." },
      { status: 400 }
    );
  }

  const { message, filter = "all" } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Build customer filter
  const now = new Date();
  const cutoff7d = new Date(now.getTime() - 7 * 86400000);
  const cutoff30d = new Date(now.getTime() - 30 * 86400000);

  const customers = await db.customer.findMany({
    where: {
      businessId: business.id,
      ...(filter === "inactive_7d" ? { lastSeenAt: { lt: cutoff7d } } : {}),
      ...(filter === "inactive_30d" ? { lastSeenAt: { lt: cutoff30d } } : {}),
    },
    select: { id: true, phoneNumber: true },
  });

  if (customers.length === 0) {
    return NextResponse.json({ error: "No customers match this filter" }, { status: 400 });
  }

  // Create campaign
  const campaign = await db.campaign.create({
    data: {
      businessId: business.id,
      message: message.trim(),
      status: "running",
      totalCalls: customers.length,
    },
  });

  // Create call records
  const callRecords = await db.$transaction(
    customers.map((c) =>
      db.campaignCall.create({
        data: {
          campaignId: campaign.id,
          customerId: c.id,
          phoneNumber: c.phoneNumber,
        },
      })
    )
  );

  // Fire calls in batches of 10
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const hanNumber = business.phoneNumber;
  const voiceId = business.voiceId ?? "21m00Tcm4TlvDq8ikWAM";
  const statusBaseUrl = `${baseUrl}/api/webhooks/voice/outbound/campaign-status`;
  const twimlBase =
    `${baseUrl}/api/webhooks/voice/outbound` +
    `?businessPhone=${encodeURIComponent(hanNumber)}&type=campaign` +
    `&message=${encodeURIComponent(message.trim())}`;

  const BATCH = 10;
  let sentCalls = 0;
  let failedCalls = 0;

  for (let i = 0; i < callRecords.length; i += BATCH) {
    const batch = callRecords.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (cr) => {
        const statusUrl = `${statusBaseUrl}?callId=${cr.id}`;
        const sid = await makeCall(cr.phoneNumber, hanNumber, twimlBase, statusUrl).catch(
          (err) => { console.error(`[Campaigns] Failed to call ${cr.phoneNumber}:`, err); return null; }
        );
        if (sid) {
          sentCalls++;
          await db.campaignCall.update({ where: { id: cr.id }, data: { status: "calling", twilioCallSid: sid } }).catch(() => null);
        } else {
          failedCalls++;
          await db.campaignCall.update({ where: { id: cr.id }, data: { status: "failed" } }).catch(() => null);
        }
      })
    );
  }

  // Mark campaign completed
  const updated = await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: "completed",
      sentCalls,
      failedCalls,
      completedAt: new Date(),
    },
  });

  console.log(`[Campaigns] Campaign ${campaign.id} done — sent=${sentCalls} failed=${failedCalls}`);
  return NextResponse.json({ campaign: updated });
}
