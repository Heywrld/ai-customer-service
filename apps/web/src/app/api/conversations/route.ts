import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/conversations?status=active&limit=50
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ conversations: [] });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "active" | "resolved" | null (all)
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const conversations = await db.conversation.findMany({
    where: {
      businessId: business.id,
      ...(status ? { status } : {}),
    },
    include: {
      customer: { select: { name: true, phoneNumber: true, usesPidgin: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ conversations });
}
