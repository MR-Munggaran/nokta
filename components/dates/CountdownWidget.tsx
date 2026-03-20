"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarHeart } from "lucide-react";

interface Props {
  days:            number;
  title:           string;
  emoji:           string;
  recurringYearly: boolean;
}

export function CountdownWidget({ days, title, emoji, recurringYearly }: Props) {
  const maxDays  = recurringYearly ? 365 : Math.max(days, 1);
  const progress = Math.max(0, Math.min(100, ((maxDays - days) / maxDays) * 100));
  const isToday  = days === 0;

  // Pakai ref untuk track apakah sudah mount — tidak trigger re-render
  const barRef      = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Gunakan useEffect hanya untuk side effect DOM — tidak setState synchronously
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Animasi bar via DOM ref langsung — tidak perlu state
  useEffect(() => {
    if (!barRef.current) return;
    const t = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.width = `${progress}%`;
      }
    }, 300);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <Link
      href="/dates"
      className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 hover:bg-stone-50 transition-colors active:scale-[0.97] overflow-hidden relative"
    >
      {/* Glow kalau hari ini */}
      {isToday && (
        <div className="absolute inset-0 bg-linear-to-br from-rose-50/80 to-transparent pointer-events-none animate-pulse" />
      )}

      <div className="relative flex items-center justify-between">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Countdown</span>
        <CalendarHeart className={`w-4 h-4 ${isToday ? "text-rose-500" : "text-rose-400"}`} />
      </div>

      {/* Emoji + days */}
      <div className="relative flex items-center gap-2">
        <span className={`text-2xl transition-transform duration-300 ${isToday ? "animate-bounce" : ""}`}>
          {emoji}
        </span>
        <div>
          <p className={`text-2xl font-bold leading-none ${isToday ? "text-rose-500" : "text-stone-800"}`}>
            {isToday ? "🎉" : days}
          </p>
          <p className="text-[10px] text-stone-400">
            {isToday ? "Hari ini!" : "hari lagi"}
          </p>
        </div>
      </div>

      {/* Title */}
      <p className="relative text-xs text-stone-500 font-medium truncate">{title}</p>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isToday ? "bg-rose-400" : "bg-rose-300"
          }`}
          style={{ width: "0%" }}
        />
      </div>

      <p className="relative text-[10px] text-stone-300">
        {recurringYearly
          ? `${Math.round(progress)}% menuju hari ini`
          : isToday
            ? "Selamat merayakan! 🎉"
            : `${days} hari tersisa`
        }
      </p>
    </Link>
  );
}