"use client";

import { HOURS, DAYS_SHORT, MONTHS, todayKey, toDateKey, startOfWeek, addDays } from "@/lib/scheduleUtils";
import { EventPill } from "./EventPill";
import type { ScheduleEvent } from "@/db/schema";

interface Props {
  cursor:       Date;
  events:       ScheduleEvent[];
  onSlotClick:  (date: string, hour: string) => void;
  onEventClick: (ev: ScheduleEvent) => void;
}

export function WeeklyView({ cursor, events, onSlotClick, onEventClick }: Props) {
  const sw    = startOfWeek(cursor);
  const today = todayKey();
  const days  = Array.from({ length: 7 }, (_, i) => addDays(sw, i));

  function eventsAt(date: Date, hour: string) {
    const key = toDateKey(date);
    return events.filter((e) => e.eventDate === key && e.startTime === hour);
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Header row */}
      <div className="grid border-b border-stone-100" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-stone-100 bg-stone-50" />
        {days.map((d, i) => {
          const key     = toDateKey(d);
          const isToday = key === today;
          return (
            <div
              key={i}
              className={`flex flex-col items-center py-2.5 text-center border-r border-stone-100 last:border-r-0
                ${isToday ? "bg-emerald-50" : "bg-stone-50"}`}
            >
              <span className="text-[10px] text-stone-400 font-medium">{DAYS_SHORT[d.getDay()]}</span>
              <span className={`mt-1 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold
                ${isToday ? "bg-emerald-500 text-white" : "text-stone-700"}`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time rows */}
      <div className="overflow-y-auto max-h-[560px]">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid border-b border-stone-50 last:border-b-0 min-h-[52px]"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            {/* Time label */}
            <div className="flex items-start pt-2 px-2 border-r border-stone-50">
              <span className="text-[10px] text-stone-400 font-medium">{hour}</span>
            </div>

            {/* Day cells */}
            {days.map((d, i) => {
              const key    = toDateKey(d);
              const evs    = eventsAt(d, hour);
              const isToday = key === today;
              return (
                <div
                  key={i}
                  onClick={() => evs.length === 0 && onSlotClick(key, hour)}
                  className={`p-1 border-r border-stone-50 last:border-r-0 transition-colors
                    ${evs.length === 0
                      ? `cursor-pointer ${isToday ? "hover:bg-emerald-50" : "hover:bg-stone-50"}`
                      : ""}`}
                >
                  {evs.map((ev) => (
                    <EventPill key={ev.id} event={ev} size="sm" onClick={onEventClick} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Month label bottom */}
      <div className="px-4 py-2 border-t border-stone-100 flex gap-2">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-stone-300">
            {d.getDate() === 1 ? MONTHS[d.getMonth()].slice(0, 3) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}