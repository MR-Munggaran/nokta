"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Copy } from "lucide-react";
import { DailyView }    from "./DailyView";
import { WeeklyView }   from "./WeeklyView";
import { MonthlyView }  from "./MonthlyView";
import { EventForm }    from "./EventForm";
import { CopyModal }    from "./CopyModal";
import { CategoryLegend } from "./EventPill";
import {
  addDays, startOfWeek, formatPeriodLabel, todayKey, toDateKey,
} from "@/lib/scheduleUtils";
import type { ScheduleEvent } from "@/db/schema";

type View = "daily" | "weekly" | "monthly";

interface Props {
  initialEvents: ScheduleEvent[];
}

export function ScheduleClient({ initialEvents }: Props) {
  const [view,   setView]   = useState<View>("weekly");
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  // ── Event form modal ────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | undefined>();
  const [defaultDate,  setDefaultDate]  = useState<string>(todayKey());
  const [defaultHour,  setDefaultHour]  = useState<string>("09.00");

  // ── Copy modal ──────────────────────────────────────────────────────────────
  const [copyOpen,      setCopyOpen]      = useState(false);
  const [copyingEvent,  setCopyingEvent]  = useState<ScheduleEvent | undefined>();

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    setCursor((prev) => {
      if (view === "daily")   return addDays(prev, dir);
      if (view === "weekly")  return addDays(prev, dir * 7);
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  function goToday() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    setCursor(d);
  }

  // ── Open event-form helpers ─────────────────────────────────────────────────

  function openCreate(date?: string, hour?: string) {
    setEditingEvent(undefined);
    setDefaultDate(date ?? todayKey());
    setDefaultHour(hour ?? "09.00");
    setModalOpen(true);
  }

  function openEdit(ev: ScheduleEvent) {
    setEditingEvent(ev);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(undefined);
  }

  // ── Open copy-modal helpers ─────────────────────────────────────────────────

  /** Open copy modal pre-filled with a single event (from EventForm copy button) */
  function openCopySingle(ev: ScheduleEvent) {
    setCopyingEvent(ev);
    setCopyOpen(true);
  }

  /** Open copy modal in week/month mode (no specific event) */
  function openCopyBulk() {
    setCopyingEvent(undefined);
    setCopyOpen(true);
  }

  function closeCopy() {
    setCopyOpen(false);
    setCopyingEvent(undefined);
  }

  // ── Month date click ────────────────────────────────────────────────────────

  function handleDayClick(dateStr: string) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    setCursor(d);
    setView("daily");
  }

  const isToday = toDateKey(cursor) === todayKey();

  return (
    <>
      {/* ─── Top bar ─────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Jadwal Bersama 💑</h1>
          <p className="text-sm text-stone-400 mt-0.5">Rencanakan hari kalian berdua</p>
        </div>

        {/* Desktop action buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={openCopyBulk}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            Salin Jadwal
          </button>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* ─── View switcher + navigation ──────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        {/* View tabs */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-0.5">
          {(["daily", "weekly", "monthly"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === v
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {v === "daily" ? "Harian" : v === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <div className="flex items-center gap-2 ml-auto">
          {!isToday && (
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Hari ini
            </button>
          )}
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-stone-700 min-w-[160px] text-center">
            {formatPeriodLabel(view, cursor)}
          </span>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Legend ──────────────────────────────────────────────────────── */}
      <CategoryLegend />

      {/* ─── Calendar views ──────────────────────────────────────────────── */}
      {view === "daily" && (
        <DailyView
          cursor={cursor}
          events={initialEvents}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}
      {view === "weekly" && (
        <WeeklyView
          cursor={cursor}
          events={initialEvents}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}
      {view === "monthly" && (
        <MonthlyView
          cursor={cursor}
          events={initialEvents}
          onDayClick={handleDayClick}
          onEventClick={openEdit}
        />
      )}

      {/* ─── Empty state ─────────────────────────────────────────────────── */}
      {initialEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center mt-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="font-semibold text-stone-700 mb-1">Belum ada kegiatan</h2>
          <p className="text-sm text-stone-400 max-w-[200px] leading-relaxed">
            Mulai rencanakan kegiatan dan kencan kalian
          </p>
        </div>
      )}

      {/* ─── Mobile FABs ─────────────────────────────────────────────────── */}
      {/* Copy FAB */}
      <button
        onClick={openCopyBulk}
        className="md:hidden fixed bottom-[calc(72px+80px)] right-5 z-40 w-12 h-12 rounded-full bg-white border border-stone-200 text-stone-500 flex items-center justify-center shadow-md active:scale-90 transition-all"
      >
        <Copy className="w-5 h-5" />
      </button>

      {/* Add FAB */}
      <button
        onClick={() => openCreate()}
        className="md:hidden fixed bottom-[calc(72px+20px)] right-5 z-40 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ─── Event form modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <EventForm
          event={editingEvent}
          defaultDate={defaultDate}
          defaultHour={defaultHour}
          onClose={closeModal}
          onCopy={openCopySingle}
        />
      )}

      {/* ─── Copy modal ───────────────────────────────────────────────────── */}
      {copyOpen && (
        <CopyModal
          event={copyingEvent}
          cursor={cursor}
          onClose={closeCopy}
        />
      )}
    </>
  );
}