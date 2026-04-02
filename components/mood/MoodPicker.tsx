"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMood } from "@/actions/mood";
import { toast } from "sonner";
import type { MoodCheckin } from "@/actions/mood";

const MOOD_OPTIONS = [
  { score: 1, emoji: "😭", label: "Sedih Banget" },
  { score: 2, emoji: "😔", label: "Sedih" },
  { score: 3, emoji: "😕", label: "Kurang" },
  { score: 4, emoji: "😐", label: "Biasa" },
  { score: 5, emoji: "😊", label: "Baik" },
  { score: 6, emoji: "🥰", label: "Sayang 💕" },
  { score: 7, emoji: "🤣", label: "Ngakak" },
  { score: 8, emoji: "🤩", label: "Luar Biasa" },
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
    <div className="bg-white rounded-2xl border border-stone-100 p-5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <p className="font-semibold text-stone-800 text-sm sm:text-base">
          Bagaimana perasaanmu hari ini?
        </p>
        <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
          {existing
            ? "Kamu sudah check-in hari ini — bisa diperbarui"
            : "Belum check-in hari ini"}
        </p>
      </div>

      {/* Mood selector
          Mobile  : flex row, semua sejajar
          Desktop : tetap row tapi tombol lebih tinggi & emoji lebih besar */}
      <div className="flex justify-between gap-1.5 sm:gap-2">
        {MOOD_OPTIONS.map(({ score, emoji, label }) => (
          <button
            key={score}
            type="button"
            onClick={() => setSelected(score)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 sm:py-4 rounded-2xl border-2 transition-all active:scale-95 ${
              selected === score
                ? "bg-indigo-50 border-indigo-200 shadow-sm"
                : "bg-stone-50 border-stone-100 hover:bg-stone-100 hover:border-stone-200"
            }`}
          >
            <span className="text-2xl sm:text-3xl">{emoji}</span>
            <span
              className={`text-[10px] sm:text-xs font-medium leading-tight text-center ${
                selected === score ? "text-indigo-600" : "text-stone-400"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Note + Button
          Mobile  : stack vertikal
          sm+     : note dan button side-by-side */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ceritakan sedikit tentang harimu... (opsional)"
          rows={2}
          className="w-full sm:flex-1 bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !selected || (!hasChanged && !!existing)}
          className="w-full sm:w-auto sm:shrink-0 py-3 sm:py-3.5 sm:px-6 bg-indigo-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:bg-indigo-600 active:scale-95"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : existing ? (
            "Perbarui Mood"
          ) : (
            "Simpan Mood 💕"
          )}
        </button>
      </div>
    </div>
  );
}