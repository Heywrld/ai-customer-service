import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/conversations/[id] — full thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = await db.conversation.findFirst({
    where: { id, businessId: business.id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      aiUsage: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ conversation });
}

// PATCH /api/conversations/[id] — update status (resolve / escalate)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = await db.conversation.updateMany({
    where: { id, businessId: business.id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ success: true, updated: conversation.count });
}
