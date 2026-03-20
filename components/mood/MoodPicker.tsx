"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMood } from "@/actions/mood";
import { toast } from "sonner";
import type { MoodCheckin } from "@/actions/mood";

const MOOD_OPTIONS = [
  { score: 1, emoji: "😔", label: "Sedih" },
  { score: 2, emoji: "😕", label: "Kurang" },
  { score: 3, emoji: "😐", label: "Biasa" },
  { score: 4, emoji: "😊", label: "Baik" },
  { score: 5, emoji: "🤩", label: "Luar Biasa" },
];

export function MoodPicker({ existing }: { existing: MoodCheckin | null }) {
  const router  = useRouter();
  const [selected, setSelected] = useState<number | null>(existing?.moodScore ?? null);
  const [note, setNote]         = useState(existing?.note ?? "");
  const [loading, setLoading]   = useState(false);

  const hasChanged =
    selected !== existing?.moodScore ||
    note !== (existing?.note ?? "");

  async function handleSubmit() {
    if (!selected) return toast.error("Pilih mood kamu dulu");
    setLoading(true);

    const mood = MOOD_OPTIONS.find((m) => m.score === selected)!;
    const result = await submitMood({
      moodScore: selected,
      emoji:     mood.emoji,
      note:      note || undefined,
    });

    setLoading(false);
    if (!result.success) return toast.error(result.error);
    toast.success(existing ? "Mood diperbarui!" : "Mood hari ini disimpan! 💕");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
      <div>
        <p className="font-semibold text-stone-800 text-sm">Bagaimana perasaanmu hari ini?</p>
        <p className="text-xs text-stone-400 mt-0.5">
          {existing ? "Kamu sudah check-in hari ini — bisa diperbarui" : "Belum check-in hari ini"}
        </p>
      </div>

      {/* Mood selector */}
      <div className="flex justify-between gap-1">
        {MOOD_OPTIONS.map(({ score, emoji, label }) => (
          <button
            key={score}
            type="button"
            onClick={() => setSelected(score)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
              selected === score
                ? "bg-indigo-50 border-indigo-200"
                : "bg-stone-50 border-stone-100 hover:bg-stone-100"
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className={`text-[10px] font-medium ${
              selected === score ? "text-indigo-600" : "text-stone-400"
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ceritakan sedikit tentang harimu... (opsional)"
        rows={2}
        className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
      />

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selected || (!hasChanged && !!existing)}
        className="w-full py-3.5 bg-indigo-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : existing ? "Perbarui Mood" : "Simpan Mood 💕"
        }
      </button>
    </div>
  );
}