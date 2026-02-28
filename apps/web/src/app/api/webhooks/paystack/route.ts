import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@han/database";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { metadata, status } = event.data;
    if (status !== "success") return NextResponse.json({ ok: true });

    const { businessId, plan } = metadata ?? {};
    if (!businessId || !plan) return NextResponse.json({ ok: true });

    // Upgrade the business plan + extend trial if applicable
    const trialEndsAt = new Date();
    trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 1); // plan valid 1 year

    await db.business.update({
      where: { id: businessId },
      data: {
        plan,
        trialEndsAt,
        monthlyCallCount: 0, // reset usage on upgrade
      },
    }).catch(console.error);

    console.log(`[Paystack] Upgraded business ${businessId} to ${plan}`);
  }

  return NextResponse.json({ ok: true });
}
