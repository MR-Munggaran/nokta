"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLetter } from "@/actions/letters";
import { toast } from "sonner";
import { Pencil, X, Plus } from "lucide-react";

interface Props {
  desktopTrigger?: boolean;
}

export function LetterForm({ desktopTrigger = false }: Props) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createLetter({
        title:   fd.get("title") as string,
        content: fd.get("content") as string,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Surat terkirim! 💕");
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
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tulis Surat
        </button>
        {open && <LetterFormModal onClose={handleClose} onSubmit={handleSubmit} loading={loading} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-[calc(72px+20px)] right-5 z-40 w-14 h-14 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
      >
        <Pencil className="w-5 h-5" />
      </button>
      {open && <LetterFormModal onClose={handleClose} onSubmit={handleSubmit} loading={loading} />}
    </>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function LetterFormModal({
  onClose, onSubmit, loading,
}: {
  onClose:  () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading:  boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-[88px] sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85dvh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 flex-shrink-0">
          <h2 className="font-bold text-stone-800">Tulis Surat</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Judul</label>
            <input
              name="title"
              type="text"
              placeholder="Untuk kamu yang selalu ada..."
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Isi Surat</label>
            <textarea
              name="content"
              rows={8}
              placeholder="Hei sayang, hari ini aku mau ceritain sesuatu..."
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 bg-pink-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Kirim Surat 💕"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}