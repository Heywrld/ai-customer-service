import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@han/database";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

const maskPhone = (p: string) => p.replace(/(\d{4})\d{3}(\d{4})/, "$1***$2");

const timeAgo = (d: Date) => {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  resolved: "bg-slate-100 text-slate-600",
  escalated: "bg-amber-100 text-amber-700",
};

const TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
];

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) redirect("/dashboard/onboarding");

  const { status: statusFilter } = await searchParams;
  const activeTab = TABS.find((t) => t.value === statusFilter)?.value ?? "all";

  const conversations = await db.conversation.findMany({
    where: {
      businessId: business.id,
      ...(activeTab !== "all" ? { status: activeTab } : {}),
    },
    include: {
      customer: { select: { name: true, phoneNumber: true, usesPidgin: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const totalCount = await db.conversation.count({
    where: {
      businessId: business.id,
      ...(activeTab !== "all" ? { status: activeTab } : {}),
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
        <p className="text-slate-500 text-sm mt-1">
          {conversations.length < totalCount
            ? `Showing ${conversations.length} of ${totalCount}`
            : `${totalCount} total`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-5">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/conversations?status=${tab.value}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-white shadow-sm text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No conversations yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Once customers message your WhatsApp number, their chats will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const phone = conv.customer.phoneNumber;
            return (
              <Link
                key={conv.id}
                href={`/dashboard/conversations/${conv.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* WhatsApp dot */}
                <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[#25D366] shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-slate-800 text-sm">
                      {conv.customer.name ?? maskPhone(phone)}
                    </span>
                    {conv.customer.usesPidgin && <span className="text-xs">🇳🇬</span>}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusBadge[conv.status] ?? statusBadge.active
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {lastMsg?.content ?? "No messages"}
                  </p>
                </div>

                <span className="text-xs text-slate-400 shrink-0">
                  {lastMsg ? timeAgo(lastMsg.createdAt) : ""}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
