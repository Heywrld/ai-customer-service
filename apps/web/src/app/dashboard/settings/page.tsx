"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save, CheckCircle, Copy, Check, Phone, Play, Pause, Lock } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";

interface BusinessProfile {
  name: string;
  industry: string;
  city: string;
  systemPrompt: string;
  whatsappNumber: string;
  phoneNumber: string;
  phoneNumberProvider: string;
  plan: string;
}

interface VoiceOption {
  voiceId: string;
  name: string;
  description: string;
  gender: string | null;
  previewUrl: string | null;
  isDefault: boolean;
  locked: boolean;
  requiredPlan: string | null;
  selected: boolean;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ChannelStatus({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? label : "Not configured"}
    </span>
  );
}

// ─── Voice card ───────────────────────────────────────────────────────────────
function VoiceCard({
  voice, selected, onSelect,
}: {
  voice: VoiceOption;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.previewUrl) return;

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(voice.previewUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    audioRef.current.play();
    setPlaying(true);
  };

  return (
    <div
      onClick={() => !voice.locked && onSelect(voice.voiceId)}
      className={`relative flex flex-col gap-2 p-4 rounded-xl border transition-all duration-150 ${
        voice.locked
          ? "border-slate-200 bg-slate-50 opacity-60 cursor-default"
          : selected
          ? "border-sky-400 bg-sky-50 cursor-pointer"
          : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
      }`}
    >
      {/* Lock badge */}
      {voice.locked && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          <Lock className="h-2.5 w-2.5" />
          {voice.requiredPlan ? `${voice.requiredPlan.charAt(0).toUpperCase() + voice.requiredPlan.slice(1)}+` : "Upgrade"}
        </div>
      )}

      {/* Selected indicator */}
      {selected && !voice.locked && (
        <div className="absolute top-2.5 right-2.5">
          <CheckCircle className="h-4 w-4 text-sky-500" />
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Preview button */}
        <button
          onClick={togglePreview}
          disabled={!voice.previewUrl || voice.locked}
          className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            voice.previewUrl && !voice.locked
              ? "bg-slate-200 hover:bg-sky-100 text-slate-600 hover:text-sky-600"
              : "bg-slate-100 text-slate-300 cursor-default"
          }`}
        >
          {playing
            ? <Pause className="h-3 w-3" />
            : <Play className="h-3 w-3 translate-x-px" />}
        </button>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-none">
            {voice.name}
            {voice.isDefault && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">Default</span>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{voice.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [form, setForm] = useState<BusinessProfile>({
    name: "", industry: "", city: "Lagos",
    systemPrompt: "", whatsappNumber: "", phoneNumber: "",
    phoneNumberProvider: "byon", plan: "trial",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Voice state
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const appUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin)
    : "";

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
            phoneNumberProvider: d.business.phoneNumberProvider ?? "byon",
            plan: d.business.plan ?? "trial",
          });
        }
        setLoading(false);
      });

    // Load voices
    setVoicesLoading(true);
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d) => {
        setVoices(d.voices ?? []);
        setSelectedVoiceId(d.currentVoiceId ?? "");
      })
      .finally(() => setVoicesLoading(false));
  }, []);

  const set = (key: keyof BusinessProfile, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveVoice = async (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    setVoiceError("");
    setVoiceSaving(true);
    const res = await fetch("/api/business/voice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId }),
    });
    setVoiceSaving(false);
    if (!res.ok) {
      const err = await res.json();
      setVoiceError(err.error ?? "Failed to save voice");
      return;
    }
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const whatsappWebhook = `${appUrl}/api/webhooks/twilio`;
  const voiceWebhook = `${appUrl}/api/webhooks/voice`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your business profile and channel configuration</p>
      </div>

      <div className="space-y-6">

        {/* Business info */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Business Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                <select value={form.industry} onChange={(e) => set("industry", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                  <option value="">Select…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <select value={form.city} onChange={(e) => set("city", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                  {NIGERIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-[#25D366] text-lg" />
              <h2 className="text-base font-semibold text-slate-800">WhatsApp</h2>
            </div>
            <ChannelStatus active={!!form.whatsappNumber} label="Active" />
          </div>
          <p className="text-xs text-slate-400 mb-4">Your Twilio WhatsApp number that customers message</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Twilio WhatsApp number</label>
            <input type="tel" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="+14155238886"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-500 mb-1">Webhook URL — paste this in your Twilio console:</p>
            <div className="flex items-center">
              <code className="text-xs font-mono text-slate-700 break-all flex-1">{whatsappWebhook}</code>
              <CopyButton text={whatsappWebhook} />
            </div>
          </div>
        </section>

        {/* Voice calls */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Phone className="text-sky-500 h-4 w-4" />
              <h2 className="text-base font-semibold text-slate-800">Voice Calls</h2>
            </div>
            <ChannelStatus active={!!form.phoneNumber} label={
              form.phoneNumberProvider === "han_twilio" ? "Han-managed" : "Active"
            } />
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {form.phoneNumberProvider === "han_twilio"
              ? "Your number is managed by Han. Webhook is auto-configured."
              : "Your voice number that customers call"}
          </p>

          {form.phoneNumberProvider === "han_twilio" ? (
            <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-600 mb-0.5">Your Han-managed number</p>
              <p className="text-base font-mono font-semibold text-slate-800">{form.phoneNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Webhook is automatically configured. No action needed.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Voice number</label>
                <input type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)}
                  placeholder="+234XXXXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-500 mb-1">Webhook URL — paste this in your Twilio/AT console:</p>
                <div className="flex items-center">
                  <code className="text-xs font-mono text-slate-700 break-all flex-1">{voiceWebhook}</code>
                  <CopyButton text={voiceWebhook} />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Voice picker */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-800">AI Voice</h2>
            <div className="flex items-center gap-2">
              {voiceSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
              {voiceSaved && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            The voice Han uses on phone calls. Click ▶ to preview.
          </p>

          {voicesLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading voices…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voices.map((v) => (
                  <VoiceCard
                    key={v.voiceId}
                    voice={{ ...v, selected: selectedVoiceId === v.voiceId }}
                    selected={selectedVoiceId === v.voiceId}
                    onSelect={saveVoice}
                  />
                ))}
              </div>

              {voiceError && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{voiceError}</p>
              )}

              {/* Enterprise clone CTA */}
              <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm">🎤</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Clone your own voice</p>
                  <p className="text-xs text-slate-500">Record 1 minute — Han answers every call in your voice. Enterprise only.</p>
                </div>
                {form.plan === "enterprise" ? (
                  <button className="text-xs text-sky-600 font-medium hover:underline shrink-0">Set up →</button>
                ) : (
                  <Link href="/dashboard/billing" className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium shrink-0 hover:bg-slate-300 transition-colors">
                    Upgrade
                  </Link>
                )}
              </div>

              {/* Unlock message for restricted plans */}
              {voices.some((v) => v.locked) && (
                <p className="mt-3 text-xs text-slate-400 text-center">
                  🔒 Locked voices unlock on{" "}
                  <Link href="/dashboard/billing" className="text-sky-500 hover:underline">Business plan</Link>
                  {" "}— 5 curated voices to choose from.
                </p>
              )}
            </>
          )}
        </section>

        {/* AI System Prompt */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-800">AI System Prompt</h2>
            <span className={`text-xs font-mono ${form.systemPrompt.length > 1800 ? "text-red-500" : "text-slate-400"}`}>
              {form.systemPrompt.length}/2000
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Han uses this to understand your business and answer customer questions</p>
          <textarea value={form.systemPrompt} onChange={(e) => set("systemPrompt", e.target.value)}
            rows={8}
            maxLength={2000}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
        </section>

        {/* Plan */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Plan</h2>
              <p className="text-sm text-slate-500 mt-0.5 capitalize">{form.plan} plan</p>
            </div>
            <Link href="/dashboard/billing" className="text-sm text-sky-500 hover:text-sky-600 font-medium">Upgrade →</Link>
          </div>
        </section>
      </div>

      {/* Save button */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <CheckCircle className="h-4 w-4" /> Saved!
            </div>
          )}
        </div>
        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{saveError}</p>
        )}
      </div>
    </div>
  );
}
