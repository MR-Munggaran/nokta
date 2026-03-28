"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Tambahkan ini
import { deleteSpecialDate } from "@/actions/dates";
import { getDaysUntil } from "@/lib/dateUtils";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import type { SpecialDate } from "@/actions/dates";

interface Props {
  item: SpecialDate;
  featured?: boolean;
}

export function CountdownCard({ item, featured = false }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const days = getDaysUntil(item.date, item.recurringYearly);
  const isToday = days === 0;
  const isPast = days < 0;

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
    <motion.div
      layout // Animasi otomatis jika posisi kartu berubah dalam list
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`relative bg-white rounded-2xl border overflow-hidden ${
        isToday ? "border-rose-300 shadow-md shadow-rose-100" : "border-stone-100 shadow-sm"
      } ${featured ? "md:p-6" : "p-4"}`}
    >
      {/* Background Glow untuk Hari Ini */}
      {isToday && (
        <motion.div 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-rose-100 via-white to-transparent pointer-events-none" 
        />
      )}

      <div className={`relative flex items-center gap-4 ${featured ? "p-2 md:p-0" : ""}`}>
        
        {/* Emoji + Countdown Box */}
        <motion.div 
          whileHover={{ rotate: [0, -10, 10, 0] }} // Goyang lucu saat hover emoji
          className={`flex flex-col items-center justify-center rounded-2xl flex-shrink-0 transition-colors ${
            isToday ? "bg-rose-500 text-white" : "bg-stone-50"
          } ${featured ? "w-20 h-20 md:w-24 md:h-24" : "w-16 h-16"}`}
        >
          <span className={`leading-none ${featured ? "text-3xl md:text-4xl" : "text-2xl"}`}>
            {item.emoji}
          </span>
          {!isPast && (
            <span className={`font-bold mt-1 tracking-tighter ${
              isToday ? "text-white" : "text-stone-400"
            } ${featured ? "text-[11px]" : "text-[9px]"}`}>
              {isToday ? "HARI INI" : `${days} HARI`}
            </span>
          )}
        </motion.div>

        {/* Info Detail */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className={`font-bold text-stone-800 truncate ${featured ? "text-lg md:text-xl" : "text-sm"}`}>
              {item.title}
            </h3>
            <p className="text-[11px] text-stone-400 font-medium">
              {new Date(item.date).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: item.recurringYearly ? undefined : "numeric",
              })}
              {item.recurringYearly && " · Setiap Tahun"}
            </p>
          </div>

          <div className="mt-2">
            {isToday ? (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold"
              >
                🎉 HAPPY DAY!
              </motion.div>
            ) : !isPast && (
              <div className="flex items-center gap-2">
                {/* Progress bar tipis (opsional/manis) */}
                <div className="h-1 w-12 bg-stone-100 rounded-full overflow-hidden hidden md:block">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-stone-300"
                  />
                </div>
                <p className="text-[11px] font-medium text-stone-500">
                  {days === 1 ? "Besok banget!" : `${days} hari lagi`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-end gap-2 mb-10">
           <motion.button
            whileHover={{ scale: 1.1, color: "#ef4444" }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={busy}
            className="p-2 text-stone-300 transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Tampilan Angka Besar untuk Featured Desktop */}
      {featured && !isToday && !isPast && (
        <motion.p 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:block absolute right-8 bottom-6 text-6xl font-black text-stone-100/80 pointer-events-none"
        >
          {days}
        </motion.p>
      )}
    </motion.div>
  );
}