"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle } from "lucide-react";

interface BusinessProfile {
  name: string;
  industry: string;
  city: string;
  systemPrompt: string;
  whatsappNumber: string;
  phoneNumber: string;
  plan: string;
}

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan",
  "Enugu", "Kaduna", "Benin City", "Jos", "Aba",
];

const INDUSTRIES = [
  "Fashion & Clothing", "Food & Restaurant", "Electronics",
  "Beauty & Hair", "Health & Pharmacy", "Logistics & Delivery",
  "Real Estate", "Retail / General Store", "Travel & Tours", "Other",
];

export default function SettingsPage() {
  const [form, setForm] = useState<BusinessProfile>({
    name: "",
    industry: "",
    city: "Lagos",
    systemPrompt: "",
    whatsappNumber: "",
    phoneNumber: "",
    plan: "starter",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => {
        if (d.business) {
          setForm({
            name: d.business.name ?? "",
            industry: d.business.industry ?? "",
            city: d.business.city ?? "Lagos",
            systemPrompt: d.business.systemPrompt ?? "",
            whatsappNumber: d.business.whatsappNumber ?? "",
            phoneNumber: d.business.phoneNumber ?? "",
            plan: d.business.plan ?? "starter",
          });
        }
        setLoading(false);
      });
  }, []);

  const set = (key: keyof BusinessProfile, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your business profile and AI configuration</p>
      </div>

      <div className="space-y-6">
        {/* Business info */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Business Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Select…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <select
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {NIGERIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">WhatsApp Configuration</h2>
          <p className="text-xs text-slate-400 mb-4">Your Twilio WhatsApp number that customers message</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Twilio WhatsApp number
            </label>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="+14155238886"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="mt-4 bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-slate-600 mb-1">Webhook URL for Twilio console:</p>
            <p className="text-xs font-mono text-slate-500 break-all select-all">
              https://yourapp.vercel.app/api/webhooks/whatsapp
            </p>
          </div>
        </section>

        {/* AI System Prompt */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">AI System Prompt</h2>
          <p className="text-xs text-slate-400 mb-4">
            Han uses this to understand your business and answer customer questions
          </p>
          <textarea
            value={form.systemPrompt}
            onChange={(e) => set("systemPrompt", e.target.value)}
            rows={8}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
          />
        </section>

        {/* Plan */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Plan</h2>
              <p className="text-sm text-slate-500 mt-0.5 capitalize">{form.plan} plan</p>
            </div>
            <button className="text-sm text-sky-500 hover:text-sky-600 font-medium">
              Upgrade →
            </button>
          </div>
        </section>
      </div>

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </button>

        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Saved!
          </div>
        )}
      </div>
    </div>
  );
}
