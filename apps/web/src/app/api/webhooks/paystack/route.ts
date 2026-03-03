import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@han/database";
import { releaseNumber } from "@han/voice";

async function assignPoolNumber(businessId: string) {
  try {
    const poolNumber = await db.phoneNumberPool.findFirst({
      where: { assignedBusinessId: null, whatsappReady: true },
      orderBy: { createdAt: "asc" },
    });
    if (!poolNumber) {
      console.warn(`[Paystack] No pool numbers available for business ${businessId}`);
      return;
    }
    await db.$transaction([
      db.phoneNumberPool.update({
        where: { id: poolNumber.id },
        data: { assignedBusinessId: businessId, assignedAt: new Date() },
      }),
      db.business.update({
        where: { id: businessId },
        data: {
          phoneNumber: poolNumber.phoneNumber,
          phoneNumberSid: poolNumber.twilioSid,
          phoneNumberProvider: "han_pool",
          whatsappNumber: poolNumber.phoneNumber,
          whatsappProvider: "han_pool",
        },
      }),
    ]);
    console.log(`[Paystack] Pool number ${poolNumber.phoneNumber} assigned to business ${businessId}`);
  } catch (err) {
    console.error("[Paystack] Failed to assign pool number:", err);
  }
}

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
  console.log("[Paystack] Event:", event.event);

  // ── charge.success ────────────────────────────────────────────────────────
  // Fires on every successful charge (first payment + each recurring renewal).
  // Use this to activate/re-activate the plan.
  if (event.event === "charge.success") {
    const { metadata, status } = event.data;
    if (status !== "success") return NextResponse.json({ ok: true });

    const { businessId, plan } = metadata ?? {};
    if (!businessId || !plan) return NextResponse.json({ ok: true });

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const updatedBusiness = await db.business.update({
      where: { id: businessId },
      data: {
        plan,
        trialEndsAt: nextYear,
        monthlyCallCount: 0,
        isActive: true,
        subscriptionStatus: "active",
      },
    }).catch(console.error);

    // Assign a pool number if the business doesn't already have one
    const biz = updatedBusiness ?? await db.business.findUnique({ where: { id: businessId } }).catch(() => null);
    if (biz && biz.phoneNumberProvider !== "han_pool" && !biz.phoneNumber) {
      await assignPoolNumber(businessId);
    }

    console.log(`[Paystack] charge.success → upgraded business ${businessId} to ${plan}`);
  }

  // ── subscription.create ───────────────────────────────────────────────────
  // Fires after the first charge when a Paystack plan code was included.
  // Store the subscription_code so we can manage it later (cancel, etc).
  // Paystack passes the transaction's metadata through to the subscription event.
  else if (event.event === "subscription.create") {
    const { subscription_code, metadata } = event.data;
    const businessId = metadata?.businessId;
    if (!subscription_code || !businessId) return NextResponse.json({ ok: true });

    await db.business.update({
      where: { id: businessId },
      data: { subscriptionCode: subscription_code, subscriptionStatus: "active" },
    }).catch(console.error);

    console.log(`[Paystack] subscription.create → stored code ${subscription_code} on business ${businessId}`);
  }

  // ── invoice.update (payment failed) ──────────────────────────────────────
  // Fires when Paystack tries to renew and the card fails.
  // Block the account — getPlanStatus() will reject further calls.
  else if (event.event === "invoice.update") {
    const { subscription, status } = event.data;
    if (status !== "failed") return NextResponse.json({ ok: true });

    const subscriptionCode = subscription?.subscription_code;
    if (!subscriptionCode) return NextResponse.json({ ok: true });

    await db.business.updateMany({
      where: { subscriptionCode },
      data: { subscriptionStatus: "payment_failed", isActive: false },
    }).catch(console.error);

    console.log(`[Paystack] invoice.update failed → blocked subscription ${subscriptionCode}`);
  }

  // ── subscription.disable ──────────────────────────────────────────────────
  // Fires when a subscription is cancelled (by business, by Paystack after
  // repeated failed payments, or via API). Release their Twilio number so
  // we're not billed for orphaned numbers.
  else if (event.event === "subscription.disable") {
    const { subscription_code } = event.data;
    if (!subscription_code) return NextResponse.json({ ok: true });

    const business = await db.business.findFirst({
      where: { subscriptionCode: subscription_code },
    }).catch(() => null);

    if (!business) {
      console.warn(`[Paystack] subscription.disable: no business found for ${subscription_code}`);
      return NextResponse.json({ ok: true });
    }

    if (business.phoneNumberProvider === "han_pool") {
      // Reclaim pool number — do NOT release to Twilio, just mark as available again
      await db.phoneNumberPool.updateMany({
        where: { assignedBusinessId: business.id },
        data: { assignedBusinessId: null, assignedAt: null },
      }).catch((err) => console.error("[Paystack] Failed to reclaim pool number:", err));
      console.log(`[Paystack] Reclaimed pool number ${business.phoneNumber} from business ${business.id}`);
    } else if (business.phoneNumberProvider === "han_twilio" && business.phoneNumberSid) {
      // Legacy: release individually-purchased Twilio numbers
      await releaseNumber(business.phoneNumberSid).catch((err) =>
        console.error("[Paystack] Failed to release Twilio number:", err)
      );
      console.log(`[Paystack] Released Twilio number ${business.phoneNumber} for business ${business.id}`);
    }

    const isHanManaged = business.phoneNumberProvider === "han_pool" || business.phoneNumberProvider === "han_twilio";

    await db.business.update({
      where: { id: business.id },
      data: {
        plan: "trial",
        subscriptionStatus: "cancelled",
        subscriptionCode: null,
        isActive: false,
        phoneNumber: isHanManaged ? null : business.phoneNumber,
        phoneNumberSid: isHanManaged ? null : business.phoneNumberSid,
        phoneNumberProvider: isHanManaged ? "byon" : business.phoneNumberProvider,
        whatsappNumber: isHanManaged ? null : business.whatsappNumber,
        whatsappProvider: isHanManaged ? "byon" : business.whatsappProvider,
      },
    }).catch(console.error);

    console.log(`[Paystack] subscription.disable → cancelled business ${business.id}`);
  }

  return NextResponse.json({ ok: true });
}
