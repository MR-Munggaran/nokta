"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBucketItem, deleteBucketItem } from "@/actions/bucketList";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import type { BucketItem } from "@/actions/bucketList";

const CATEGORY_EMOJI: Record<string, string> = {
  travel:   "✈️",
  food:     "🍜",
  adventure:"🏔️",
  romance:  "💕",
  creative: "🎨",
  general:  "⭐",
};

export function BucketItemCard({
  item,
  completedByName,
}: {
  item:            BucketItem;
  completedByName?: string;
}) {
  const router  = useRouter();
  const [busy, setBusy] = useState(false);

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

  const emoji = CATEGORY_EMOJI[item.category] ?? "⭐";

  return (
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

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={busy}
        className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0 mt-0.5"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}