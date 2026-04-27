"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Copy, CalendarDays, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { copyScheduleEvent, copyWeekEvents, copyMonthEvents } from "@/actions/schedule";
import { MONTHS, startOfWeek, toDateKey } from "@/lib/scheduleUtils";
import type { ScheduleEvent } from "@/db/schema";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CopyMode = "single" | "week" | "month";

interface Props {
  /** Provided when copying a single event */
  event?: ScheduleEvent;
  /** Current calendar cursor – used for week/month copy */
  cursor: Date;
  onClose: () => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function CopyModal({ event, cursor, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Default mode: single if an event is provided, else week
  const [mode, setMode] = useState<CopyMode>(event ? "single" : "week");

  // Single-copy target date
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date(cursor);
    d.setDate(d.getDate() + 1);
    return toDateKey(d);
  });

  // Week-copy: how many weeks ahead?
  const [weekOffset, setWeekOffset] = useState(1);

  // Month-copy: how many months ahead?
  const [monthOffset, setMonthOffset] = useState(1);

  // ── Derived labels ──────────────────────────────────────────────────────────

  const sw = startOfWeek(cursor);
  const weekLabel = `Minggu ${sw.getDate()} ${MONTHS[sw.getMonth()]}`;

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleCopy() {
    startTransition(async () => {
      if (mode === "single") {
        if (!event) return;
        const result = await copyScheduleEvent(event.id, targetDate);
        if (!result.success) { toast.error(result.error); return; }
        toast.success(`Kegiatan disalin ke ${targetDate} ✓`);
      }

      if (mode === "week") {
        const result = await copyWeekEvents(toDateKey(sw), weekOffset);
        if (!result.success) { toast.error(result.error); return; }
        toast.success(`${result.data.count} kegiatan disalin ke ${weekOffset} minggu ke depan 🎉`);
      }

      if (mode === "month") {
        const result = await copyMonthEvents(
          cursor.getFullYear(),
          cursor.getMonth(),
          monthOffset,
        );
        if (!result.success) { toast.error(result.error); return; }
        toast.success(`${result.data.count} kegiatan disalin ke bulan berikutnya 🎉`);
      }

      router.refresh();
      onClose();
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center pb-22 sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-emerald-500" />
            <h2 className="font-bold text-stone-800">Salin Kegiatan</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Salin sebagai
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Single – only shown when an event is passed */}
              {event && (
                <ModeCard
                  active={mode === "single"}
                  icon="📋"
                  label="1 Kegiatan"
                  onClick={() => setMode("single")}
                />
              )}
              <ModeCard
                active={mode === "week"}
                icon="📅"
                label="1 Minggu"
                onClick={() => setMode("week")}
              />
              <ModeCard
                active={mode === "month"}
                icon="🗓️"
                label="1 Bulan"
                onClick={() => setMode("month")}
              />
            </div>
          </div>

          {/* ── Single mode ── */}
          {mode === "single" && event && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <p className="text-xs text-stone-400 mb-0.5">Kegiatan yang disalin</p>
                <p className="text-sm font-semibold text-stone-700">{event.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {event.eventDate} · {event.startTime}
                  {event.endTime ? `–${event.endTime}` : ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Salin ke tanggal
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>
            </div>
          )}

          {/* ── Week mode ── */}
          {mode === "week" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-xs text-stone-400">Menyalin semua kegiatan dari</p>
                  <p className="text-sm font-semibold text-stone-700">{weekLabel}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Salin ke berapa minggu ke depan?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setWeekOffset(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                        ${weekOffset === n
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100"}`}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 text-center">
                  minggu ke depan
                </p>
              </div>
            </div>
          )}

          {/* ── Month mode ── */}
          {mode === "month" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-stone-400 shrink-0" />
                <div>
                  <p className="text-xs text-stone-400">Menyalin semua kegiatan dari</p>
                  <p className="text-sm font-semibold text-stone-700">{monthLabel}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Salin ke berapa bulan ke depan?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMonthOffset(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                        ${monthOffset === n
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100"}`}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 text-center">
                  bulan ke depan
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          <button
            onClick={onClose}
            disabled={pending}
            className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleCopy}
            disabled={pending}
            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
          >
            {pending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Sekarang
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODE CARD ────────────────────────────────────────────────────────────────

function ModeCard({
  active, icon, label, onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all
        ${active
          ? "bg-emerald-50 text-emerald-700 border-emerald-400"
          : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100"}`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}