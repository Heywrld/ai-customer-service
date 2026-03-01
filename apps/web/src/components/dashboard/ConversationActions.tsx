"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

export function ConversationActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const update = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      {status !== "resolved" && status !== "escalated" && (
        <>
          <button
            onClick={() => update("resolved")}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            {loading === "resolved" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            Mark resolved
          </button>
          <button
            onClick={() => update("escalated")}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {loading === "escalated" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            Escalate
          </button>
        </>
      )}

      {status === "resolved" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Resolved
          </span>
          <button
            onClick={() => update("active")}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            {loading === "active" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reopen
          </button>
        </div>
      )}

      {status === "escalated" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Escalated
          </span>
          <button
            onClick={() => update("resolved")}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            {loading === "resolved" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
            Mark resolved
          </button>
          <button
            onClick={() => update("active")}
            disabled={!!loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            {loading === "active" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}
