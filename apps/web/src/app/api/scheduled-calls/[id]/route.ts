import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// DELETE /api/scheduled-calls/[id] — cancel a pending scheduled call
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const call = await db.scheduledCall.findFirst({
    where: { id, businessId: business.id },
  });

  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (call.status !== "pending") {
    return NextResponse.json({ error: "Only pending calls can be cancelled" }, { status: 400 });
  }

  await db.scheduledCall.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ ok: true });
}
