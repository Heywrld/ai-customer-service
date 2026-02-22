"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Loader2, MessageSquare } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  industry: string;
  city: string;
  description: string;
  systemPrompt: string;
  whatsappNumber: string;
}

const INDUSTRIES = [
  "Fashion & Clothing",
  "Food & Restaurant",
  "Electronics",
  "Beauty & Hair",
  "Health & Pharmacy",
  "Logistics & Delivery",
  "Real Estate",
  "Retail / General Store",
  "Travel & Tours",
  "Other",
];

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan",
  "Enugu", "Kaduna", "Benin City", "Jos", "Aba",
];

// ─── Step indicators ──────────────────────────────────────────────────────────
const STEPS = [
  { label: "Business" },
  { label: "What you sell" },
  { label: "WhatsApp" },
  { label: "Test" },
];

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          done
            ? "bg-sky-500 text-white"
            : active
            ? "bg-sky-500 text-white ring-4 ring-sky-100"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? <CheckCircle className="h-4 w-4" /> : step + 1}
      </div>
      {step < STEPS.length - 1 && (
        <div className={`h-0.5 w-12 sm:w-20 mx-1 ${done ? "bg-sky-500" : "bg-slate-200"}`} />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    industry: "",
    city: "Lagos",
    description: "",
    systemPrompt: "",
    whatsappNumber: "",
  });

  // Test chat state
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  const set = (key: keyof FormData, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Generate system prompt from description (step 2 → step 3 transition)
  const generateSystemPrompt = () => {
    const prompt = `You are a helpful customer service AI for ${form.name}, a ${form.industry} business based in ${form.city}, Nigeria.

About the business: ${form.description}

Guidelines:
- Be warm, friendly, and professional
- Keep responses concise (2-4 sentences)
- If you don't know something specific, say so honestly
- Accept Pidgin English if the customer uses it
- Use ₦ (Naira) for all prices
- Never make up prices or availability — tell customers you'll check and get back to them if unsure`;

    set("systemPrompt", prompt);
  };

  const next = async () => {
    setError("");

    if (step === 0) {
      if (!form.name.trim()) return setError("Business name is required");
      if (!form.industry) return setError("Please select your industry");
    }

    if (step === 1) {
      if (!form.description.trim()) return setError("Please describe what you sell");
      generateSystemPrompt();
    }

    if (step === 2) {
      // Save to DB
      setLoading(true);
      try {
        const res = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            industry: form.industry,
            city: form.city,
            systemPrompt: form.systemPrompt || undefined,
            whatsappNumber: form.whatsappNumber || undefined,
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } catch {
        setLoading(false);
        return setError("Failed to save. Please try again.");
      }
      setLoading(false);
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const sendTestMessage = async () => {
    if (!testInput.trim() || testLoading) return;
    const userMsg = testInput.trim();
    setTestInput("");
    setTestHistory((h) => [...h, { role: "user", content: userMsg }]);
    setTestLoading(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: testHistory,
          business: {
            name: form.name,
            description: form.systemPrompt || form.description,
          },
        }),
      });
      const data = await res.json();
      setTestHistory((h) => [...h, { role: "assistant", content: data.response }]);
    } catch {
      setTestHistory((h) => [
        ...h,
        { role: "assistant", content: "Sorry, test failed. Check your API key." },
      ]);
    }
    setTestLoading(false);
  };

  const finish = () => {
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your AI is live!</h2>
        <p className="text-slate-500">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Set up Han</h1>
        <p className="text-slate-500 text-sm">Takes about 5 minutes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <StepIndicator key={i} step={i} current={step} />
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs font-medium text-sky-500 uppercase tracking-wider mb-2">
        Step {step + 1} of {STEPS.length} — {STEPS[step].label}
      </p>

      {/* ── Step 0: Business Info ──────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Business name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Adunola's Boutique"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Industry *
            </label>
            <select
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              City
            </label>
            <select
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {NIGERIAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Step 1: What you sell ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              What do you sell or offer? *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder={`e.g. We sell women's clothing — ankara dresses, corporate outfits, and accessories. Prices range from ₦5,000 to ₦80,000. We deliver to all Lagos zones within 24 hours. Payment via Paystack or bank transfer.`}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Be specific — prices, delivery zones, payment methods. Han uses this to answer customer questions.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: WhatsApp ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-medium text-emerald-800 text-sm">Connect WhatsApp</p>
                <p className="text-emerald-700 text-xs mt-1">
                  Han uses Twilio to send and receive WhatsApp messages. Enter your Twilio WhatsApp number below.
                  You can also skip this for now and set it up in Settings later.
                </p>
              </div>
            </div>
          </div>

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
            <p className="text-xs text-slate-400 mt-1.5">
              Format: +1XXXXXXXXXX (Twilio number, not your personal number)
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Webhook URL to paste in Twilio:</p>
            <div className="bg-slate-100 rounded-lg px-3 py-2 font-mono text-xs text-slate-700 break-all select-all">
              https://yourapp.vercel.app/api/webhooks/whatsapp
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Test ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Try talking to Han like a customer would. It&apos;s already trained on your business info.
          </p>

          {/* Chat window */}
          <div className="bg-white border border-slate-200 rounded-xl h-72 overflow-y-auto flex flex-col p-4 gap-3">
            {testHistory.length === 0 && (
              <p className="text-slate-400 text-xs text-center mt-auto mb-auto">
                Type a message to test your AI…
              </p>
            )}
            {testHistory.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-slate-100 text-slate-800 rounded-br-sm"
                      : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {testHistory.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                "Do you deliver to Lekki?",
                "Wetin una sell?",
                "How much be delivery?",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setTestInput(chip);
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
              placeholder="Type a test message…"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              onClick={sendTestMessage}
              disabled={!testInput.trim() || testLoading}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={finish}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            🚀 Go live!
          </button>
        )}
      </div>

      {/* Skip link on step 2 */}
      {step === 2 && (
        <p className="text-center mt-3">
          <button
            onClick={next}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Skip for now, set up WhatsApp later in Settings
          </button>
        </p>
      )}
    </div>
  );
}
