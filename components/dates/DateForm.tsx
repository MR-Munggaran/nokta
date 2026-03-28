"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSpecialDate } from "@/actions/dates";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const EMOJI_OPTIONS = ["💍", "🎂", "✈️", "💕", "🏠", "🎓", "👶", "🌸", "🎉", "⭐", "🗓️", "💫"];

interface Props {
  desktopTrigger?: boolean;
}

export function DateForm({ desktopTrigger = false }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [emoji, setEmoji]         = useState("🗓️");
  const [recurring, setRecurring] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setEmoji("🗓️");
    setRecurring(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const result = await createSpecialDate({
        title:           fd.get("title") as string,
        emoji,
        date:            fd.get("date") as string,
        recurringYearly: recurring,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Tanggal spesial ditambahkan! 🎉");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Desktop trigger — tombol di header, hidden di mobile
  if (desktopTrigger) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah
        </button>

        {open && <DateFormModal onClose={handleClose} onSubmit={handleSubmit} loading={loading} emoji={emoji} setEmoji={setEmoji} recurring={recurring} setRecurring={setRecurring} />}
      </>
    );
  }

  // Mobile FAB — hidden di desktop
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-23 right-5 z-40 w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {open && <DateFormModal onClose={handleClose} onSubmit={handleSubmit} loading={loading} emoji={emoji} setEmoji={setEmoji} recurring={recurring} setRecurring={setRecurring} />}
    </>
  );
}

// ─── MODAL (shared) ───────────────────────────────────────────────────────────

function DateFormModal({
  onClose, onSubmit, loading, emoji, setEmoji, recurring, setRecurring,
}: {
  onClose:      () => void;
  onSubmit:     (e: React.FormEvent<HTMLFormElement>) => void;
  loading:      boolean;
  emoji:        string;
  setEmoji:     (e: string) => void;
  recurring:    boolean;
  setRecurring: (v: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-22 sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">Tambah Tanggal Spesial</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? "bg-rose-100 ring-2 ring-rose-300" : "bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Nama Hari Spesial</label>
            <input
              name="title"
              type="text"
              placeholder="Contoh: Anniversary, Ulang Tahun Kamu"
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Tanggal</label>
            <input
              name="date"
              type="date"
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-stone-700">Ulangi setiap tahun</p>
              <p className="text-xs text-stone-400">Countdown otomatis reset tiap tahun</p>
            </div>
            <div
              onClick={() => setRecurring(!recurring)}
              className={`w-11 h-6 rounded-full transition-colors relative ${recurring ? "bg-rose-500" : "bg-stone-200"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${recurring ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-3.5 bg-rose-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Simpan 💕"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}