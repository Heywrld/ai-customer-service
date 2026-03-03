"use client";

import { useEffect, useState } from "react";
import {
  Megaphone, Clock, Plus, Loader2, X, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  message: string;
  status: string;
  totalCalls: number;
  sentCalls: number;
  failedCalls: number;
  createdAt: string;
  completedAt: string | null;
}

interface ScheduledCall {
  id: string;
  phoneNumber: string;
  message: string;
  scheduledAt: string;
  status: string;
  customer: { name: string | null; phoneNumber: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function futureTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    running:   "bg-sky-50 text-sky-700 border-sky-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed:    "bg-red-50 text-red-700 border-red-200",
    sent:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [tab, setTab] = useState<"broadcasts" | "scheduled">("broadcasts");

  // Broadcasts state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [bMessage, setBMessage] = useState("");
  const [bFilter, setBFilter] = useState<"all" | "inactive_7d" | "inactive_30d">("all");
  const [bSending, setBSending] = useState(false);
  const [bError, setBError] = useState("");

  // Scheduled state
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sPhone, setSPhone] = useState("");
  const [sMessage, setSMessage] = useState("");
  const [sDate, setSDate] = useState("");
  const [sTime, setSTime] = useState("");
  const [sScheduling, setSScheduling] = useState(false);
  const [sError, setSError] = useState("");

  useEffect(() => { loadCampaigns(); loadScheduled(); }, []);

  const loadCampaigns = () => {
    setCampaignsLoading(true);
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => null)
      .finally(() => setCampaignsLoading(false));
  };

  const loadScheduled = () => {
    setScheduledLoading(true);
    fetch("/api/scheduled-calls")
      .then((r) => r.json())
      .then((d) => setScheduledCalls(d.scheduledCalls ?? []))
      .catch(() => null)
      .finally(() => setScheduledLoading(false));
  };

  const sendBroadcast = async () => {
    setBError("");
    if (!bMessage.trim()) return setBError("Message is required");
    setBSending(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: bMessage.trim(), filter: bFilter }),
    });
    const data = await res.json();
    if (!res.ok) { setBError(data.error ?? "Failed"); setBSending(false); return; }
    setBSending(false);
    setShowBroadcastModal(false);
    setBMessage(""); setBFilter("all");
    loadCampaigns();
  };

  const scheduleCall = async () => {
    setSError("");
    if (!sPhone.trim()) return setSError("Phone number is required");
    if (!sMessage.trim()) return setSError("Message is required");
    if (!sDate || !sTime) return setSError("Date and time are required");

    const scheduledAt = new Date(`${sDate}T${sTime}`).toISOString();
    setSScheduling(true);
    const res = await fetch("/api/scheduled-calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: sPhone.trim(), message: sMessage.trim(), scheduledAt }),
    });
    const data = await res.json();
    if (!res.ok) { setSError(data.error ?? "Failed"); setSScheduling(false); return; }
    setSScheduling(false);
    setShowScheduleModal(false);
    setSPhone(""); setSMessage(""); setSDate(""); setSTime("");
    loadScheduled();
  };

  const cancelScheduled = async (id: string) => {
    await fetch(`/api/scheduled-calls/${id}`, { method: "DELETE" });
    loadScheduled();
  };

  const FILTERS = [
    { value: "all", label: "All customers" },
    { value: "inactive_7d", label: "Inactive 7+ days" },
    { value: "inactive_30d", label: "Inactive 30+ days" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
        <p className="text-slate-500 text-sm mt-1">Send voice messages to your customers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(["broadcasts", "scheduled"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t === "broadcasts" ? <Megaphone className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {t === "broadcasts" ? "Broadcasts" : "Scheduled"}
          </button>
        ))}
      </div>

      {/* ── Broadcasts tab ──────────────────────────────────────────────────── */}
      {tab === "broadcasts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              Send a voice message to multiple customers at once
            </p>
            <button onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" /> New Broadcast
            </button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <Megaphone className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No broadcasts yet</p>
              <p className="text-slate-400 text-xs mt-1">Send a promo, announcement, or follow-up to all your customers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const pct = c.totalCalls > 0
                  ? Math.round(((c.sentCalls + c.failedCalls) / c.totalCalls) * 100)
                  : 0;
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm text-slate-800 leading-relaxed line-clamp-2 flex-1">
                        {c.message}
                      </p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      <span>{c.sentCalls} answered</span>
                      <span>·</span>
                      <span>{c.failedCalls} missed</span>
                      <span>·</span>
                      <span>{c.totalCalls} total</span>
                      <span className="ml-auto">{relativeTime(c.createdAt)}</span>
                    </div>
                    {c.totalCalls > 0 && (
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Scheduled tab ───────────────────────────────────────────────────── */}
      {tab === "scheduled" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              Schedule a one-time call to a specific customer
            </p>
            <button onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" /> Schedule a call
            </button>
          </div>

          {scheduledLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : scheduledCalls.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No scheduled calls</p>
              <p className="text-slate-400 text-xs mt-1">Remind a customer about their appointment, order, or payment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledCalls.map((sc) => (
                <div key={sc.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-slate-800">
                          {sc.customer?.name ?? sc.phoneNumber}
                        </span>
                        {sc.customer?.name && (
                          <span className="text-xs text-slate-400 font-mono">{sc.phoneNumber}</span>
                        )}
                        <StatusBadge status={sc.status} />
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-1">{sc.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {futureTime(sc.scheduledAt)}
                      </p>
                    </div>
                    {sc.status === "pending" && (
                      <button onClick={() => cancelScheduled(sc.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Broadcast modal ─────────────────────────────────────────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">New Broadcast</h2>
              <button onClick={() => { setShowBroadcastModal(false); setBError(""); }}
                className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea value={bMessage} onChange={(e) => setBMessage(e.target.value)}
                  rows={4}
                  placeholder="e.g. Hello! We're having a 30% off sale this weekend. Come shop with us!"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Send to</label>
                <div className="space-y-2">
                  {FILTERS.map((f) => (
                    <label key={f.value} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      bFilter === f.value ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-slate-300"
                    }`}>
                      <input type="radio" name="filter" value={f.value}
                        checked={bFilter === (f.value as typeof bFilter)}
                        onChange={() => setBFilter(f.value as typeof bFilter)}
                        className="accent-sky-500" />
                      <span className="text-sm text-slate-700">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {bError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {bError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button onClick={sendBroadcast} disabled={bSending}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {bSending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Calling customers…</>
                  : <><Megaphone className="h-4 w-4" /> Send calls</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule modal ──────────────────────────────────────────────────── */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Schedule a Call</h2>
              <button onClick={() => { setShowScheduleModal(false); setSError(""); }}
                className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Customer phone <span className="text-red-400">*</span>
                </label>
                <input type="tel" value={sPhone} onChange={(e) => setSPhone(e.target.value)}
                  placeholder="+234XXXXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea value={sMessage} onChange={(e) => setSMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Hello! This is a reminder that your appointment is tomorrow at 2pm."
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                  <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time (WAT)</label>
                  <input type="time" value={sTime} onChange={(e) => setSTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
              </div>

              {sError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {sError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button onClick={scheduleCall} disabled={sScheduling}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {sScheduling
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Schedule call</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
