"use client";

import { useEffect, useRef, useState } from "react";
import type { HanVoice } from "@han/voice";

const GENDER_ICONS: Record<string, string> = {
  male: "♂",
  female: "♀",
};

const CATEGORY_LABELS: Record<string, string> = {
  premade: "Standard",
  cloned: "Cloned",
  generated: "Generated",
};

function VoiceCard({
  voice,
  isSelected,
  isSaving,
  onSelect,
}: {
  voice: HanVoice;
  isSelected: boolean;
  isSaving: boolean;
  onSelect: (voiceId: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function togglePreview(e: React.MouseEvent) {
    e.stopPropagation();
    if (!voice.previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(voice.previewUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  return (
    <button
      onClick={() => onSelect(voice.voiceId)}
      disabled={isSaving}
      className={[
        "relative w-full text-left rounded-2xl border p-5 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        isSelected
          ? "bg-sky-500/10 border-sky-500/60 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
          : "bg-slate-900 border-white/5 hover:border-white/15 hover:bg-slate-800/60",
      ].join(" ")}
    >
      {/* Selected indicator */}
      {isSelected && (
        <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
          ✓
        </span>
      )}

      {/* Voice name + category */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg">
          {GENDER_ICONS[voice.gender ?? ""] ?? "🎙"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{voice.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {CATEGORY_LABELS[voice.category] ?? voice.category}
            {voice.accent ? ` · ${voice.accent}` : ""}
          </p>
        </div>
      </div>

      {/* Description */}
      {voice.description && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
          {voice.description}
        </p>
      )}

      {/* Preview button */}
      {voice.previewUrl && (
        <button
          onClick={togglePreview}
          className={[
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isPlaying
              ? "bg-sky-500/20 text-sky-300"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          {isPlaying ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              Playing…
            </>
          ) : (
            <>
              <span>▶</span>
              Preview voice
            </>
          )}
        </button>
      )}
    </button>
  );
}

export function VoicePicker({
  currentVoiceId,
}: {
  currentVoiceId?: string | null;
}) {
  const [voices, setVoices] = useState<HanVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(
    currentVoiceId ?? "21m00Tcm4TlvDq8ikWAM"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [filter, setFilter] = useState<"all" | "female" | "male">("all");

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((data) => {
        setVoices(data.voices ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Couldn't load voices. Check your ElevenLabs API key.");
        setLoading(false);
      });
  }, []);

  async function handleSelect(voiceId: string) {
    setSelectedId(voiceId);
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/business/voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  const filtered = voices.filter(
    (v) => filter === "all" || v.gender === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Voice</h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose the voice your customers hear when Han answers calls.
          </p>
        </div>

        {/* Save status */}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400 border border-green-500/20">
            ✓ Voice saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 border border-red-500/20">
            Failed to save
          </span>
        )}
      </div>

      {/* Gender filter */}
      <div className="flex gap-2">
        {(["all", "female", "male"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={[
              "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === g
                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                : "bg-slate-900 text-slate-400 border border-white/5 hover:border-white/15",
            ].join(" ")}
          >
            {g === "all" ? "All voices" : g === "female" ? "♀ Female" : "♂ Male"}
          </button>
        ))}
        {voices.length > 0 && (
          <span className="ml-auto self-center text-xs text-slate-600">
            {filtered.length} voice{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-slate-900 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-slate-500 py-12">No voices found.</p>
      )}

      {/* Voice grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((voice) => (
            <VoiceCard
              key={voice.voiceId}
              voice={voice}
              isSelected={selectedId === voice.voiceId}
              isSaving={isSaving}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 pt-2">
        Click a voice to select it · Click "Preview voice" to listen before committing.
        Your choice is saved automatically.
      </p>
    </div>
  );
}
