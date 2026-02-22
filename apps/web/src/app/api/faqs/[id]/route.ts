import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@han/database";

// PUT /api/faqs/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const faq = await db.faqTemplate.updateMany({
    where: { id, businessId: business.id },
    data: {
      triggerPhrases: body.triggerPhrases ?? undefined,
      response: body.response ?? undefined,
      language: body.language ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });

  return NextResponse.json({ success: true, updated: faq.count });
}

// DELETE /api/faqs/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.faqTemplate.deleteMany({
    where: { id, businessId: business.id },
  });

  return NextResponse.json({ success: true });
}
