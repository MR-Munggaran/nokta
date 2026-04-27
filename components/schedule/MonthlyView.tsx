"use client";

import { DAYS_SHORT, todayKey, toDateKey, buildMonthGrid } from "@/lib/scheduleUtils";
import { EventPill } from "./EventPill";
import type { ScheduleEvent } from "@/db/schema";

interface Props {
  cursor:       Date;
  events:       ScheduleEvent[];
  onDayClick:   (date: string) => void;
  onEventClick: (ev: ScheduleEvent) => void;
}

export function MonthlyView({ cursor, events, onDayClick, onEventClick }: Props) {
  const today  = todayKey();
  const cells  = buildMonthGrid(cursor);
  const curMon = cursor.getMonth();

  function eventsOn(d: Date) {
    const key = toDateKey(d);
    return events.filter((e) => e.eventDate === key);
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-stone-400 bg-stone-50 border-r border-stone-100 last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <div key={w} className="grid grid-cols-7 border-b border-stone-100 last:border-b-0">
          {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
            const key       = toDateKey(d);
            const isToday   = key === today;
            const isThisMon = d.getMonth() === curMon;
            const evs       = eventsOn(d);

            return (
              <div
                key={i}
                onClick={() => onDayClick(key)}
                className={`min-h-22 p-1.5 border-r border-stone-100 last:border-r-0 cursor-pointer transition-colors
                  ${isToday ? "bg-emerald-50/70 hover:bg-emerald-50" : "hover:bg-stone-50"}
                  ${!isThisMon ? "bg-stone-50/50" : ""}`}
              >
                {/* Date number */}
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1
                  ${isToday ? "bg-emerald-500 text-white" : isThisMon ? "text-stone-700" : "text-stone-300"}`}>
                  {d.getDate()}
                </div>

                {/* Events */}
                {evs.slice(0, 3).map((ev) => (
                  <EventPill
                    key={ev.id}
                    event={ev}
                    size="sm"
                    onClick={(clickedEv) => { onEventClick(clickedEv); }}
                  />
                ))}
                {evs.length > 3 && (
                  <p className="text-[9px] text-stone-400 font-medium pl-0.5">
                    +{evs.length - 3} lagi
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}