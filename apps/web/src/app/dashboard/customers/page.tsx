import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@han/database";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

const maskPhone = (p: string) => p.replace(/(\+\d{3})\d{4}(\d{4})/, "$1****$2");

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default async function CustomersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) redirect("/dashboard/onboarding");

  const customers = await db.customer.findMany({
    where: { businessId: business.id },
    include: {
      // No take limit — need all conversations to sum messages correctly
      conversations: {
        where: { channel: "whatsapp" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, status: true, updatedAt: true, messageCount: true },
      },
      _count: { select: { conversations: true } },
    },
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-500 text-sm mt-1">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} have messaged your business
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No customers yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Once someone messages your WhatsApp number, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header row — desktop only */}
          <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wide">
            <span className="col-span-5">Customer</span>
            <span className="col-span-2 text-center">Chats</span>
            <span className="col-span-2 text-center">Messages</span>
            <span className="col-span-2">Last seen</span>
            <span className="col-span-1" />
          </div>

          <ul className="divide-y divide-slate-100">
            {customers.map((customer) => {
              const lastConv = customer.conversations[0];
              const totalMessages = customer.conversations.reduce(
                (s, c) => s + c.messageCount,
                0
              );

              return (
                <li key={customer.id}>
                  <div className="flex md:grid md:grid-cols-12 items-center px-4 md:px-5 py-3 md:py-4 gap-3 md:gap-0 hover:bg-slate-50 transition-colors">
                    {/* Customer info — always visible */}
                    <div className="flex-1 md:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-sky-600">
                          {(customer.name ?? customer.phoneNumber).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {customer.name ?? maskPhone(customer.phoneNumber)}
                          </span>
                          {customer.usesPidgin && <span className="text-xs">🇳🇬</span>}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {customer.name ? maskPhone(customer.phoneNumber) : ""}
                        </span>
                      </div>
                    </div>

                    {/* Chats count — desktop only */}
                    <div className="hidden md:block md:col-span-2 text-center">
                      <span className="text-sm text-slate-600 font-medium">
                        {customer._count.conversations}
                      </span>
                    </div>

                    {/* Messages count — desktop only */}
                    <div className="hidden md:block md:col-span-2 text-center">
                      <span className="text-sm text-slate-600 font-medium">{totalMessages}</span>
                    </div>

                    {/* Last seen — show on all sizes */}
                    <div className="md:col-span-2 shrink-0">
                      <span className="text-xs text-slate-400">
                        {customer.lastSeenAt ? timeAgo(customer.lastSeenAt) : "—"}
                      </span>
                    </div>

                    {/* View arrow */}
                    <div className="md:col-span-1 flex justify-end shrink-0">
                      {lastConv ? (
                        <Link
                          href={`/dashboard/conversations/${lastConv.id}`}
                          className="text-slate-300 hover:text-sky-500 transition-colors"
                          title="View conversation"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="h-4 w-4 block" />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
