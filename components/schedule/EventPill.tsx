"use client";

import { CATEGORY_META } from "@/lib/scheduleUtils";
import type { EventCategory } from "@/db/schema";
import type { ScheduleEvent } from "@/db/schema";

interface Props {
  event:    ScheduleEvent;
  size?:    "sm" | "md";
  onClick?: (ev: ScheduleEvent) => void;
}

export function EventPill({ event, size = "md", onClick }: Props) {
  const meta = CATEGORY_META[event.category as EventCategory];

  if (size === "sm") {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={`w-full text-left truncate text-[10px] font-semibold px-1.5 py-0.5 rounded mb-0.5
          ${meta.pillBg} ${meta.pillText}`}
      >
        {meta.emoji} {event.title}
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
        transition-all hover:brightness-95 active:scale-95
        ${meta.pillBg} ${meta.pillText}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotBg}`} />
      {event.title}
      {event.endTime && (
        <span className="opacity-60 font-normal">
          {event.startTime}–{event.endTime}
        </span>
      )}
    </button>
  );
}

// ─── LEGEND ──────────────────────────────────────────────────────────────────

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {(Object.entries(CATEGORY_META) as [EventCategory, typeof CATEGORY_META[EventCategory]][]).map(
        ([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dotBg}`} />
            <span className="text-xs text-stone-500">{meta.label}</span>
          </div>
        ),
      )}
    </div>
  );
}