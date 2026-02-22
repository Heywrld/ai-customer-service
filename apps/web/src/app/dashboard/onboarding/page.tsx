"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, ChevronRight, Loader2, MessageSquare, RefreshCw,
} from "lucide-react";

interface FormData {
  name: string;
  industry: string;
  city: string;
  description: string;
  systemPrompt: string;
  // Voice
  selectedNumber: string;   // chosen from Han's pool
  byonNumber: string;       // business's own number
  useByon: boolean;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string | null;
}

const INDUSTRIES = [
  "Fashion & Clothing", "Food & Restaurant", "Electronics",
  "Beauty & Hair", "Health & Pharmacy", "Logistics & Delivery",
  "Real Estate", "Retail / General Store", "Travel & Tours", "Other",
];

const NIGERIAN_CITIES = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan",
  "Enugu", "Kaduna", "Benin City", "Jos", "Aba",
];

const STEPS = [
  { label: "Business" },
  { label: "What you sell" },
  { label: "Your number" },
  { label: "Test" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        done ? "bg-sky-500 text-white" : active ? "bg-sky-500 text-white ring-4 ring-sky-100" : "bg-slate-200 text-slate-500"
      }`}>
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
    name: "", industry: "", city: "Lagos",
    description: "", systemPrompt: "",
    selectedNumber: "", byonNumber: "", useByon: false,
  });

  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [numbersPurchasing, setNumbersPurchasing] = useState(false);

  // Test chat
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Load numbers when reaching step 2
  useEffect(() => {
    if (step === 2) loadNumbers();
  }, [step]);

  const loadNumbers = async () => {
    setNumbersLoading(true);
    try {
      const res = await fetch("/api/numbers/available");
      const data = await res.json();
      const nums: AvailableNumber[] = data.numbers ?? [];
      setAvailableNumbers(nums);
      if (nums.length > 0 && !form.selectedNumber) {
        set("selectedNumber", nums[0].phoneNumber);
      }
    } catch {
      setAvailableNumbers([]);
    }
    setNumbersLoading(false);
  };

  const generateSystemPrompt = () =>
    set("systemPrompt", `You are a helpful customer service AI for ${form.name}, a ${form.industry} business based in ${form.city}, Nigeria.

About the business: ${form.description}

Guidelines:
- Be warm, friendly, and professional
- Keep responses concise (2-4 sentences)
- If you don't know something specific, say so honestly
- Accept Pidgin English if the customer uses it
- Use ₦ (Naira) for all prices
- Never make up prices or availability — tell customers to call back if unsure`);

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
      setLoading(true);
      try {
        let finalPhoneNumber: string | null = null;
        let phoneNumberProvider = "byon";

        if (form.useByon) {
          // BYON — just save the number they typed
          finalPhoneNumber = form.byonNumber.trim() || null;
        } else if (form.selectedNumber) {
          // Purchase from Han
          setNumbersPurchasing(true);
          const res = await fetch("/api/numbers/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: form.selectedNumber }),
          });
          setNumbersPurchasing(false);
          if (!res.ok) {
            const err = await res.json();
            setLoading(false);
            return setError(err.error ?? "Failed to get your number. Please try again.");
          }
          const data = await res.json();
          finalPhoneNumber = data.phoneNumber;
          phoneNumberProvider = "han_twilio";
        }

        const res = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            industry: form.industry,
            city: form.city,
            systemPrompt: form.systemPrompt || undefined,
            phoneNumber: finalPhoneNumber || undefined,
            phoneNumberProvider,
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } catch {
        setLoading(false);
        setNumbersPurchasing(false);
        return setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }

    if (step < STEPS.length - 1) setStep((s) => s + 1);
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
          business: { name: form.name, description: form.systemPrompt || form.description },
        }),
      });
      const data = await res.json();
      setTestHistory((h) => [...h, { role: "assistant", content: data.response }]);
    } catch {
      setTestHistory((h) => [...h, { role: "assistant", content: "Sorry, test failed. Check your API key." }]);
    }
    setTestLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your AI is live!</h2>
        <p className="text-slate-500">Taking you to your dashboard…</p>
      </div>
    );
  }

  const continueLabel = () => {
    if (!loading) return "Continue";
    if (numbersPurchasing) return "Getting your number…";
    return "Saving…";
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Set up Han</h1>
        <p className="text-slate-500 text-sm">Takes about 3 minutes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((_, i) => <StepIndicator key={i} step={i} current={step} />)}
      </div>

      <p className="text-xs font-medium text-sky-500 uppercase tracking-wider mb-5">
        Step {step + 1} of {STEPS.length} — {STEPS[step].label}
      </p>

      {/* ── Step 0: Business Info ──────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Business name <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Adunola's Boutique"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Industry <span className="text-red-400">*</span>
            </label>
            <select value={form.industry} onChange={(e) => set("industry", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              <option value="">Select industry…</option>
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
      )}

      {/* ── Step 1: What you sell ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              What do you sell or offer? <span className="text-red-400">*</span>
            </label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={6}
              placeholder={`e.g. We sell women's clothing — ankara dresses, corporate outfits, and accessories. Prices range from ₦5,000 to ₦80,000. We deliver to all Lagos zones within 24 hours. Payment via bank transfer or cash on delivery.`}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            <p className="text-xs text-slate-400 mt-1.5">
              Include prices, delivery zones, and payment methods — the more detail, the better Han answers customers.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Your number ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          {!form.useByon ? (
            <>
              <div className="text-center">
                <div className="text-5xl mb-3">📞</div>
                <h2 className="text-lg font-bold text-slate-900">Get your Nigerian number</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Han will answer every call to this number, 24/7 —
                  in your chosen voice, trained on your business.
                  Included in all plans.
                </p>
              </div>

              {/* Number list */}
              {numbersLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding available numbers…
                </div>
              ) : availableNumbers.length > 0 ? (
                <div className="space-y-2">
                  {availableNumbers.map((n) => (
                    <label key={n.phoneNumber} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
                      form.selectedNumber === n.phoneNumber
                        ? "border-sky-400 bg-sky-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                      <input type="radio" name="number" value={n.phoneNumber}
                        checked={form.selectedNumber === n.phoneNumber}
                        onChange={() => set("selectedNumber", n.phoneNumber)}
                        className="accent-sky-500 shrink-0" />
                      <span className="font-mono font-semibold text-slate-800 text-sm flex-1">
                        {n.friendlyName}
                      </span>
                      {n.locality && (
                        <span className="text-xs text-slate-400">{n.locality}</span>
                      )}
                    </label>
                  ))}

                  <button onClick={loadNumbers} disabled={numbersLoading}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-1 mx-auto">
                    <RefreshCw className="h-3 w-3" /> Show different numbers
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-slate-500">
                  No numbers available right now.{" "}
                  <button onClick={loadNumbers} className="text-sky-500 underline">Try again</button>
                </div>
              )}

              {/* BYON escape hatch */}
              <p className="text-center pt-1">
                <button onClick={() => set("useByon", true)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors">
                  Already have a voice number? Use it instead
                </button>
              </p>
            </>
          ) : (
            /* ─── BYON mode ─────────────────────────────────────────────── */
            <>
              <div>
                <button onClick={() => set("useByon", false)}
                  className="text-sm text-sky-500 hover:text-sky-600 mb-4 flex items-center gap-1">
                  ← Get a number from Han instead
                </button>

                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your existing voice number
                </label>
                <input type="tel" value={form.byonNumber}
                  onChange={(e) => set("byonNumber", e.target.value)}
                  placeholder="+234XXXXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-medium text-amber-800 mb-1">One manual step required</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Go to your Twilio or Africa&apos;s Talking console and set the
                  voice webhook URL to:
                </p>
                <code className="block mt-2 text-xs bg-white border border-amber-200 rounded px-3 py-2 font-mono text-slate-700 break-all select-all">
                  {typeof window !== "undefined"
                    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/webhooks/voice`
                    : "/api/webhooks/voice"}
                </code>
              </div>

              <p className="text-center">
                <button onClick={() => { set("byonNumber", ""); set("useByon", false); next(); }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline">
                  Skip — I&apos;ll set up voice calls later
                </button>
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Test Han ───────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Talk to Han like a customer would. It&apos;s already trained on {form.name}.
          </p>

          <div className="bg-white border border-slate-200 rounded-xl h-72 overflow-y-auto flex flex-col p-4 gap-3">
            {testHistory.length === 0 && (
              <p className="text-slate-400 text-xs text-center my-auto">
                Type a message below to test…
              </p>
            )}
            {testHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-slate-100 text-slate-800 rounded-br-sm"
                    : "bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {testHistory.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {["Do you deliver to Lekki?", "Wetin una sell?", "How much be delivery?"].map((chip) => (
                <button key={chip} onClick={() => setTestInput(chip)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input type="text" value={testInput} onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
              placeholder="Type a test message…"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button onClick={sendTestMessage} disabled={!testInput.trim() || testLoading}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg">
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button onClick={() => setStep((s) => s - 1)}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Back
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button onClick={next} disabled={loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />{continueLabel()}</>
              : <>Continue <ChevronRight className="h-4 w-4" /></>}
          </button>
        ) : (
          <button onClick={() => { setDone(true); setTimeout(() => router.push("/dashboard"), 1800); }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            🚀 Go live!
          </button>
        )}
      </div>
    </div>
  );
}
