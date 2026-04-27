"use client";

import { HOURS, DAYS_FULL, MONTHS, todayKey, toDateKey } from "@/lib/scheduleUtils";
import { EventPill } from "./EventPill";
import type { ScheduleEvent } from "@/db/schema";

interface Props {
  cursor:    Date;
  events:    ScheduleEvent[];
  onSlotClick: (date: string, hour: string) => void;
  onEventClick: (ev: ScheduleEvent) => void;
}

export function DailyView({ cursor, events, onSlotClick, onEventClick }: Props) {
  const key     = toDateKey(cursor);
  const isToday = key === todayKey();

  const eventsForDate = events.filter((e) => e.eventDate === key);
  const byHour = (hour: string) => eventsForDate.filter((e) => e.startTime === hour);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
          ${isToday ? "bg-emerald-500 text-white" : "bg-white border border-stone-200 text-stone-700"}`}>
          {cursor.getDate()}
        </div>
        <div>
          <p className="font-semibold text-sm text-stone-800">
            {DAYS_FULL[cursor.getDay()]}
            {isToday && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Hari ini</span>}
          </p>
          <p className="text-xs text-stone-400">
            {cursor.getDate()} {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
        </div>
      </div>

      {/* Time slots */}
      <div>
        {HOURS.map((hour) => {
          const slotEvents = byHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-stone-50 last:border-b-0 min-h-13 group"
            >
              {/* Time label */}
              <div className="w-16 shrink-0 flex items-start pt-3.5 px-3 border-r border-stone-50">
                <span className="text-[10px] text-stone-400 font-medium">{hour}</span>
              </div>

              {/* Slot content */}
              <div
                onClick={() => slotEvents.length === 0 && onSlotClick(key, hour)}
                className={`flex-1 px-3 py-2 flex flex-wrap gap-1.5 items-start
                  ${slotEvents.length === 0
                    ? "cursor-pointer hover:bg-emerald-50/50 transition-colors"
                    : ""}`}
              >
                {slotEvents.length > 0
                  ? slotEvents.map((ev) => (
                      <EventPill key={ev.id} event={ev} size="md" onClick={onEventClick} />
                    ))
                  : (
                    <span className="text-[11px] text-stone-300 group-hover:text-emerald-400 transition-colors self-center">
                      + Tambah kegiatan
                    </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}