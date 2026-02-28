"use client";

import { useEffect, useState } from "react";
import { Plus, Zap, Trash2, Edit2, ToggleLeft, ToggleRight, Loader2, AlertCircle } from "lucide-react";

interface FAQ {
  id: string;
  triggerPhrases: string[];
  response: string;
  language: string;
  hitCount: number;
  isActive: boolean;
}

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────
function FAQModal({
  faq,
  onSave,
  onClose,
}: {
  faq?: FAQ;
  onSave: (data: Partial<FAQ>) => Promise<void>;
  onClose: () => void;
}) {
  const [phrases, setPhrases] = useState(faq?.triggerPhrases.join(", ") ?? "");
  const [response, setResponse] = useState(faq?.response ?? "");
  const [language, setLanguage] = useState(faq?.language ?? "en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!phrases.trim() || !response.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave({
        triggerPhrases: phrases.split(",").map((p) => p.trim()).filter(Boolean),
        response,
        language,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">
          {faq ? "Edit FAQ" : "Add FAQ"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Trigger phrases *
              <span className="text-slate-400 font-normal ml-1">(comma separated)</span>
            </label>
            <input
              type="text"
              value={phrases}
              onChange={(e) => setPhrases(e.target.value)}
              placeholder="do you deliver, delivery, where you dey deliver"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Response *</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              placeholder="We deliver to all Lagos zones within 24 hours. Delivery fee is ₦1,500."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="en">English</option>
              <option value="pidgin">Nigerian Pidgin</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !phrases.trim() || !response.trim()}
            className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save FAQ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Card ─────────────────────────────────────────────────────────────────
function FAQCard({
  faq,
  onEdit,
  onDelete,
  onToggle,
  confirmingDelete,
  onConfirmDelete,
}: {
  faq: FAQ;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-5 transition-opacity ${
        faq.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {faq.triggerPhrases.map((p) => (
            <span
              key={p}
              className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full font-medium"
            >
              {p}
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-400 shrink-0 font-mono">
          Used {faq.hitCount}×
        </span>
      </div>

      <p className="text-sm text-slate-700 mb-4 line-clamp-3">{faq.response}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title={faq.isActive ? "Deactivate" : "Activate"}
        >
          {faq.isActive ? (
            <ToggleRight className="h-5 w-5 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>
        <button
          onClick={onEdit}
          className="text-slate-400 hover:text-sky-500 transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </button>

        {/* Two-step delete */}
        {confirmingDelete ? (
          <button
            onClick={onDelete}
            className="ml-auto text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
          >
            Confirm delete?
          </button>
        ) : (
          <button
            onClick={onConfirmDelete}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<null | "add" | FAQ>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setFaqs(data.faqs ?? []);
    } catch {
      setError("Failed to load FAQs. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  // Auto-cancel pending delete after 3s
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleSave = async (data: Partial<FAQ>) => {
    if (modal && modal !== "add") {
      const res = await fetch(`/api/faqs/${(modal as FAQ).id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
    } else {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
    }
    await fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setFaqs((f) => f.filter((x) => x.id !== id));
    } catch {
      setError("Failed to delete FAQ. Please try again.");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggle = async (faq: FAQ) => {
    try {
      const res = await fetch(`/api/faqs/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      setFaqs((f) => f.map((x) => (x.id === faq.id ? { ...x, isActive: !x.isActive } : x)));
    } catch {
      setError("Failed to update FAQ. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FAQs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Every FAQ match = ₦0.00 AI cost
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No FAQs yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Add your first FAQ — every match saves you money.
          </p>
          <button
            onClick={() => setModal("add")}
            className="mt-4 bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add your first FAQ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              onEdit={() => setModal(faq)}
              onDelete={() => handleDelete(faq.id)}
              onToggle={() => handleToggle(faq)}
              confirmingDelete={confirmDelete === faq.id}
              onConfirmDelete={() => setConfirmDelete(faq.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <FAQModal
          faq={modal === "add" ? undefined : (modal as FAQ)}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
