"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBucketItem, deleteBucketItem, updateBucketItem } from "@/actions/bucketList";
import { toast } from "sonner";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { BucketItem } from "@/actions/bucketList";
// import { handleImageUpload } from "@/lib/upload-client"; // Bisa di-uncomment jika nanti fitur edit gambar ditambahkan

const CATEGORY_EMOJI: Record<string, string> = {
  travel:   "✈️",
  food:     "🍜",
  adventure:"🏔️",
  romance:  "💕",
  creative: "🎨",
  general:  "⭐",
};

const CATEGORIES = [
  { key: "travel",    label: "Travel",      emoji: "✈️" },
  { key: "food",      label: "Kuliner",     emoji: "🍜" },
  { key: "adventure", label: "Petualangan", emoji: "🏔️" },
  { key: "romance",   label: "Romantis",    emoji: "💕" },
  { key: "creative",  label: "Kreatif",     emoji: "🎨" },
  { key: "general",   label: "Lainnya",     emoji: "⭐" },
];

export function BucketItemCard({
  item,
  completedByName,
}: {
  item:            BucketItem;
  completedByName?: string;
}) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(item.category);

  async function handleToggle() {
    setBusy(true);
    const result = await toggleBucketItem(item.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success(item.completed ? "Dibatalkan" : "Selesai! 🎉");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Hapus "${item.title}"?`)) return;
    setBusy(true);
    const result = await deleteBucketItem(item.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Item dihapus");
    router.refresh();
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      category: editCategory,
    };

    const result = await updateBucketItem(item.id, payload);
    setBusy(false);

    if (!result.success) return toast.error(result.error);

    toast.success("Item berhasil diperbarui! ✨");
    setEditOpen(false);
    router.refresh();
  }

  const emoji = CATEGORY_EMOJI[item.category] ?? "⭐";

  function handleCloseEdit() {
    setEditOpen(false);
    setEditCategory(item.category); // Kembalikan ke kategori awal
  } 

  return (
    <>
      <div className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all ${
        item.completed ? "border-emerald-100 opacity-75" : "border-stone-100"
      }`}>
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all disabled:opacity-50 ${
            item.completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-stone-300 hover:border-emerald-400"
          }`}
        >
          {item.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <p className={`font-semibold text-sm ${
              item.completed ? "line-through text-stone-400" : "text-stone-800"
            }`}>
              {item.title}
            </p>
          </div>

          {item.description && (
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">{item.description}</p>
          )}

          {item.completed && completedByName && (
            <p className="text-[11px] text-emerald-500 mt-1.5 font-medium">
              ✓ Diselesaikan oleh {completedByName}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Edit */}
          <button
            onClick={() => setEditOpen(true)}
            className="text-stone-300 hover:text-amber-500 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-[88px] sm:items-center sm:p-4">
          <div className="absolute inset-0 -z-10" onClick={() => setEditOpen(false)} />
          <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h2 className="font-bold text-stone-800">Edit Bucket List</h2>
              <button onClick={handleCloseEdit} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Apa yang ingin kalian lakukan?
                </label>
                <input
                  name="title"
                  type="text"
                  defaultValue={item.title}
                  required
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Deskripsi (opsional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={item.description || ""}
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditCategory(key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        editCategory === key
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                      }`}
                    >
                      <span>{emoji}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-[2] py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {busy
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : "Simpan Perubahan"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}