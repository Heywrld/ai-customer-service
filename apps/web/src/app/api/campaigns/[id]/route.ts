import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// GET /api/campaigns/[id] — fetch campaign + call records
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const campaign = await db.campaign.findFirst({
    where: { id, businessId: business.id },
    include: {
      calls: {
        orderBy: { createdAt: "asc" },
        include: { customer: { select: { phoneNumber: true, name: true } } },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ campaign });
}
