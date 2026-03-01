import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@han/database";
import Link from "next/link";
import { ArrowLeft, Bot, User } from "lucide-react";
import { ConversationActions } from "@/components/dashboard/ConversationActions";

const maskPhone = (p: string) => p.replace(/(\d{4})\d{3}(\d{4})/, "$1***$2");

function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(d);
}

export default async function ConversationThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const business = await db.business.findUnique({ where: { clerkUserId: userId } });
  if (!business) redirect("/dashboard/onboarding");

  const conversation = await db.conversation.findFirst({
    where: { id, businessId: business.id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      aiUsage: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) notFound();

  const phone = conversation.customer.phoneNumber;

  // Map assistant message IDs → their corresponding usage row (by order)
  const assistantMsgIds = conversation.messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.id);
  const usageByMsgId = new Map<string, (typeof conversation.aiUsage)[0]>();
  conversation.aiUsage.forEach((u, i) => {
    const msgId = assistantMsgIds[i];
    if (msgId) usageByMsgId.set(msgId, u);
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/conversations"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {conversation.customer.name ?? maskPhone(phone)}
            </h1>
            {conversation.customer.usesPidgin && <span>🇳🇬</span>}
          </div>
          <p className="text-slate-400 text-xs">
            {phone} · {conversation.channel} ·{" "}
            <span
              className={
                conversation.status === "resolved"
                  ? "text-emerald-500"
                  : conversation.status === "escalated"
                  ? "text-amber-500"
                  : "text-sky-500"
              }
            >
              {conversation.status}
            </span>
          </p>
        </div>
      </div>

      {/* Status actions */}
      <ConversationActions id={conversation.id} status={conversation.status} />

      {/* Messages */}
      <div className="mt-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-col gap-4 p-5 max-h-[60vh] overflow-y-auto">
          {conversation.messages.map((msg) => {
            const isUser = msg.role === "user";
            const usageIdx = !isUser ? usageByMsgId.get(msg.id) : undefined;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-start" : "justify-end"}`}
              >
                {isUser && (
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                )}
                <div className="max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isUser
                        ? "bg-slate-100 text-slate-800 rounded-tl-sm"
                        : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-tr-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                    {!isUser && usageIdx && (
                      <>
                        <span className="text-slate-300 text-xs">·</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {usageIdx.model.includes("haiku") ? "⚡ Haiku" : "🧠 Sonnet"}
                        </span>
                        {msg.isCached && (
                          <>
                            <span className="text-slate-300 text-xs">·</span>
                            <span className="text-xs text-emerald-500">cached</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {!isUser && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats footer */}
      {conversation.aiUsage.length > 0 && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>{conversation.messages.length} messages</span>
          <span>
            {conversation.aiUsage.filter((u) => u.model.includes("haiku")).length} Haiku ·{" "}
            {conversation.aiUsage.filter((u) => u.model.includes("sonnet")).length} Sonnet
          </span>
          <span>
            {conversation.aiUsage.filter((u) => u.cacheHit).length} cache hits
          </span>
          <span className="font-mono">
            ₦{(conversation.aiUsage.reduce((s, u) => s + Number(u.costUsd), 0) * 1600).toFixed(3)} total cost
          </span>
        </div>
      )}
    </div>
  );
}
