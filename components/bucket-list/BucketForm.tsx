"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBucketItem } from "@/actions/bucketList";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const CATEGORIES = [
  { key: "travel",    label: "Travel",    emoji: "✈️" },
  { key: "food",      label: "Kuliner",   emoji: "🍜" },
  { key: "adventure", label: "Petualangan",emoji: "🏔️" },
  { key: "romance",   label: "Romantis",  emoji: "💕" },
  { key: "creative",  label: "Kreatif",   emoji: "🎨" },
  { key: "general",   label: "Lainnya",   emoji: "⭐" },
];

export function BucketForm() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [category, setCategory] = useState("general");

  const handleClose = () => { setOpen(false); setCategory("general"); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const result = await createBucketItem({
        title:       fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        category,
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Ditambahkan ke bucket list! 🎉");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(72px+20px)] right-5 z-40 w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-[88px] sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">Tambah ke Bucket List</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Apa yang ingin kalian lakukan?
            </label>
            <input
              name="title"
              type="text"
              placeholder="Contoh: Liburan ke Bali berdua"
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Deskripsi (opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Ceritakan lebih detail..."
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Kategori
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    category === key
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 bg-amber-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Tambahkan 🎉"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}