"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBadge({ n, done }: { n: number; done: boolean }) {
  if (done) {
    return (
      <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 rounded-full border-2 border-sky-400 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-sky-500">{n}</span>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────
function CodeBlock({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-2 mt-2 font-mono text-xs text-slate-700 break-all">
      <span className="flex-1">{value}</span>
      <CopyButton text={value} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WhatsAppChannelPage() {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [currentNumber, setCurrentNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : "/api/webhooks/whatsapp";

  // Load current whatsapp number
  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        setCurrentNumber(data.business?.whatsappNumber ?? null);
        setWhatsappNumber(data.business?.whatsappNumber ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const num = whatsappNumber.trim();
    if (!num) { setError("Please enter a WhatsApp number."); return; }
    if (!/^\+\d{7,15}$/.test(num)) {
      setError("Use international format: +2348012345678");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: num }),
      });
      if (!res.ok) throw new Error("Save failed");
      setCurrentNumber(num);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isConnected = !!currentNumber;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-6 w-6 text-[#25D366]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Connect WhatsApp</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Let customers message your business on WhatsApp — Han answers instantly.
          </p>
        </div>
        {isConnected && !loading && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Connected
          </span>
        )}
      </div>

      {/* Requirement banner */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          WhatsApp Business requires a{" "}
          <strong>Twilio account</strong> and{" "}
          <strong>Meta WhatsApp approval</strong> to work.
          This is a one-time setup — follow the steps below.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {/* Step 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <StepBadge n={1} done={false} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Create a Twilio account
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                Twilio handles WhatsApp message delivery. Create a free account and get an account SID and Auth Token.
              </p>
              <a
                href="https://www.twilio.com/try-twilio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                Sign up at Twilio <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <StepBadge n={2} done={false} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Enable WhatsApp on your Twilio number
              </h3>
              <p className="text-sm text-slate-500 mb-1">
                In Twilio Console, go to{" "}
                <span className="font-medium text-slate-700">Messaging → Try it out → Send a WhatsApp message</span>.
                Follow the sandbox setup or submit for the WhatsApp Business API (takes 1–3 days with Meta).
              </p>
              <p className="text-xs text-slate-400">
                Sandbox: instant (dev only). Production: requires Meta approval + business verification.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <StepBadge n={3} done={false} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Point your Twilio number to Han
              </h3>
              <p className="text-sm text-slate-500 mb-1">
                In your Twilio WhatsApp sender settings, set the{" "}
                <strong>incoming message webhook</strong> URL to:
              </p>
              <CodeBlock value={webhookUrl} />
              <p className="text-xs text-slate-400 mt-2">
                Set HTTP method to <strong>POST</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <StepBadge n={4} done={isConnected} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Add your WhatsApp number to Han
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                Enter the WhatsApp-enabled number from your Twilio account. Use international format.
              </p>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => { setWhatsappNumber(e.target.value); setError(""); }}
                      placeholder="+2348012345678"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                      ) : saved ? (
                        <><Check className="h-3.5 w-3.5" /> Saved</>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500">{error}</p>
                  )}
                  {currentNumber && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Currently connected: {currentNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test it */}
      {isConnected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 mb-1">You&apos;re connected!</h3>
              <p className="text-sm text-emerald-700">
                Send a WhatsApp message to{" "}
                <span className="font-mono font-medium">{currentNumber}</span> to test Han.
                Customers can now message this number and Han will respond instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What customers see */}
      {!isConnected && (
        <div className="border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">What your customers will experience</h3>
          <div className="space-y-2">
            {[
              "Customer messages your WhatsApp number",
              "Han reads their message and your business context",
              "Han replies in under 2 seconds — in English or Pidgin",
              "You get a notification + full conversation in your dashboard",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-400">{i + 1}</span>
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
