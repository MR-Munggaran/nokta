"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSpecialDate } from "@/actions/dates";
import { getDaysUntil } from "@/lib/dateUtils";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { SpecialDate } from "@/actions/dates";

export function CountdownCard({ item }: { item: SpecialDate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const days    = getDaysUntil(item.date, item.recurringYearly);
  const isToday = days === 0;
  const isPast  = days < 0;

  async function handleDelete() {
    if (!confirm(`Hapus "${item.title}"?`)) return;
    setBusy(true);
    const result = await deleteSpecialDate(item.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Tanggal dihapus");
    router.refresh();
  }

  return (
    <div className={`relative bg-white rounded-2xl border p-4 overflow-hidden ${
      isToday ? "border-rose-200" : "border-stone-100"
    }`}>
      {/* Glow kalau hari ini */}
      {isToday && (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent pointer-events-none" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Emoji + countdown */}
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-stone-50 flex-shrink-0">
          <span className="text-2xl leading-none">{item.emoji}</span>
          {!isPast && (
            <span className={`text-[10px] font-bold mt-1 ${isToday ? "text-rose-500" : "text-stone-400"}`}>
              {isToday ? "HARI INI" : `${days}h`}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-sm">{item.title}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {new Date(item.date).toLocaleDateString("id-ID", {
              day:   "numeric",
              month: "long",
              year:  "numeric",
            })}
          </p>

          {isToday && (
            <p className="text-xs font-semibold text-rose-500 mt-1.5">
              🎉 Hari spesial kalian!
            </p>
          )}

          {!isToday && !isPast && (
            <p className="text-xs text-stone-400 mt-1.5">
              {days === 1 ? "Besok!" : `${days} hari lagi`}
              {item.recurringYearly && " · Tahunan"}
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}