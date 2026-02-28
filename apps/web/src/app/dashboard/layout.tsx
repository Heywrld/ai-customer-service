import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@han/database";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Find the business for this user
  const business = await db.business.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, name: true, plan: true },
  });

  // No business yet → send to onboarding (except if already there)
  // We let the onboarding page handle itself, but wrap everything in the layout
  const businessName = business?.name ?? "My Business";
  const plan = business?.plan ?? "starter";

  return (
    <div className="flex min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <Sidebar businessName={businessName} plan={plan} />
      <div className="flex-1 flex flex-col pb-16 lg:pb-0 lg:overflow-y-auto">
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
