import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// ── GET /api/scheduled-calls — list all scheduled calls ─────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ scheduledCalls: [] });

  const scheduledCalls = await db.scheduledCall.findMany({
    where: { businessId: business.id },
    include: {
      customer: { select: { name: true, phoneNumber: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ scheduledCalls });
}

// ── POST /api/scheduled-calls — schedule a call ──────────────────────────────
// body: { phoneNumber: string, message: string, scheduledAt: ISO string, customerId?: string }
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (!business.phoneNumber) {
    return NextResponse.json(
      { error: "You need an active Han number to schedule calls. Upgrade your plan." },
      { status: 400 }
    );
  }

  const { phoneNumber, message, scheduledAt, customerId } = await req.json();

  if (!phoneNumber?.trim()) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (!scheduledAt) return NextResponse.json({ error: "Scheduled time is required" }, { status: 400 });

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
  }

  const scheduledCall = await db.scheduledCall.create({
    data: {
      businessId: business.id,
      customerId: customerId ?? null,
      phoneNumber: phoneNumber.trim(),
      message: message.trim(),
      scheduledAt: scheduledDate,
    },
    include: {
      customer: { select: { name: true, phoneNumber: true } },
    },
  });

  return NextResponse.json({ scheduledCall });
}
