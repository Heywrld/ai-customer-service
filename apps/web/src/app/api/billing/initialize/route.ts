import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@han/database";

// Plan prices in kobo (NGN × 100)
const PLAN_PRICES: Record<string, number> = {
  starter:    3500000,  // ₦35,000
  business:   8500000,  // ₦85,000
  pro:       17500000,  // ₦175,000
  enterprise: 35000000, // ₦350,000
};

const PLAN_LABELS: Record<string, string> = {
  starter:    "Starter",
  business:   "Business",
  pro:        "Pro",
  enterprise: "Enterprise",
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  if (!PLAN_PRICES[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: PLAN_PRICES[plan],
      currency: "NGN",
      metadata: {
        businessId: business.id,
        clerkUserId: userId,
        plan,
        planLabel: PLAN_LABELS[plan],
      },
      callback_url: `${appUrl}/dashboard/billing?upgraded=${plan}`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    console.error("[Paystack] Initialize error:", data);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 502 });
  }

  return NextResponse.json({ url: data.data.authorization_url });
}
