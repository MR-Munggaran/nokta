"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHabit } from "@/actions/habits";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const EMOJI_OPTIONS    = ["✅", "🏃", "📚", "💪", "🧘", "🥗", "💧", "🎯", "🌅", "💊", "🎸", "🧹"];
const FREQUENCY_OPTIONS = [
  { key: "daily",  label: "Setiap hari" },
  { key: "weekly", label: "Setiap minggu" },
] as const;

interface Props {
  desktopTrigger?: boolean;
}

export function HabitForm({ desktopTrigger = false }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [emoji, setEmoji]         = useState("✅");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  const handleClose = () => {
    setOpen(false);
    setEmoji("✅");
    setFrequency("daily");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createHabit({
        title: fd.get("title") as string,
        emoji,
        frequency,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Habit baru ditambahkan! 💪");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (desktopTrigger) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>
        {open && (
          <HabitFormModal
            onClose={handleClose}
            onSubmit={handleSubmit}
            loading={loading}
            emoji={emoji}
            setEmoji={setEmoji}
            frequency={frequency}
            setFrequency={setFrequency}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-[calc(72px+20px)] right-5 z-40 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
      {open && (
        <HabitFormModal
          onClose={handleClose}
          onSubmit={handleSubmit}
          loading={loading}
          emoji={emoji}
          setEmoji={setEmoji}
          frequency={frequency}
          setFrequency={setFrequency}
        />
      )}
    </>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function HabitFormModal({
  onClose, onSubmit, loading, emoji, setEmoji, frequency, setFrequency,
}: {
  onClose:      () => void;
  onSubmit:     (e: React.FormEvent<HTMLFormElement>) => void;
  loading:      boolean;
  emoji:        string;
  setEmoji:     (e: string) => void;
  frequency:    "daily" | "weekly";
  setFrequency: (f: "daily" | "weekly") => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-[88px] sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">Tambah Habit Baru</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Emoji</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? "bg-emerald-100 ring-2 ring-emerald-300" : "bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Nama Habit</label>
            <input
              name="title"
              type="text"
              placeholder="Contoh: Olahraga 30 menit, Baca buku"
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Frekuensi</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFrequency(key)}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                    frequency === key
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Tambahkan 💪"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}