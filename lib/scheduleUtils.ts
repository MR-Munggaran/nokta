import type { EventCategory, ScheduleEvent } from "@/db/schema";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const DAYS_SHORT  = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;
export const DAYS_FULL   = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
export const MONTHS      = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
] as const;

/** Time slots shown in daily / weekly views */
export const HOURS = [
  "06.00","07.00","08.00","09.00","10.00","11.00","12.00",
  "13.00","14.00","15.00","16.00","17.00","18.00","19.00","20.00","21.00","22.00",
] as const;

// ─── CATEGORY META ────────────────────────────────────────────────────────────

export type CatMeta = {
  label:     string;
  emoji:     string;
  pillBg:    string;   // Tailwind class
  pillText:  string;
  dotBg:     string;
};

export const CATEGORY_META: Record<EventCategory, CatMeta> = {
  work:     { label: "Kerja",     emoji: "💼", pillBg: "bg-violet-100", pillText: "text-violet-700", dotBg: "bg-violet-500"  },
  date:     { label: "Pacaran",   emoji: "💕", pillBg: "bg-pink-100",   pillText: "text-pink-700",   dotBg: "bg-pink-500"    },
  health:   { label: "Kesehatan", emoji: "🏃", pillBg: "bg-emerald-100",pillText: "text-emerald-700",dotBg: "bg-emerald-500" },
  personal: { label: "Pribadi",   emoji: "⭐", pillBg: "bg-amber-100",  pillText: "text-amber-700",  dotBg: "bg-amber-500"   },
  other:    { label: "Lainnya",   emoji: "📌", pillBg: "bg-sky-100",    pillText: "text-sky-700",    dotBg: "bg-sky-500"     },
};

// ─── DATE UTILS ───────────────────────────────────────────────────────────────

export function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Build the 6-week grid used by the monthly view */
export function buildMonthGrid(d: Date): Date[] {
  const first  = startOfMonth(d);
  const last   = endOfMonth(d);
  const cells: Date[] = [];

  for (let i = 0; i < first.getDay(); i++)
    cells.push(addDays(first, i - first.getDay()));

  for (let i = 1; i <= last.getDate(); i++)
    cells.push(new Date(d.getFullYear(), d.getMonth(), i));

  while (cells.length % 7 !== 0)
    cells.push(addDays(last, cells.length - last.getDate() - first.getDay() + 1));

  return cells;
}

export function formatPeriodLabel(view: "daily" | "weekly" | "monthly", cursor: Date): string {
  if (view === "daily") {
    return `${DAYS_FULL[cursor.getDay()]}, ${cursor.getDate()} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }
  if (view === "weekly") {
    const sw = startOfWeek(cursor);
    const ew = addDays(sw, 6);
    if (sw.getMonth() === ew.getMonth())
      return `${sw.getDate()}–${ew.getDate()} ${MONTHS[sw.getMonth()]} ${sw.getFullYear()}`;
    return `${sw.getDate()} ${MONTHS[sw.getMonth()]} – ${ew.getDate()} ${MONTHS[ew.getMonth()]}`;
  }
  return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
}

export function groupEventsByDate(
  events: ScheduleEvent[],
): Record<string, ScheduleEvent[]> {
  return events.reduce<Record<string, ScheduleEvent[]>>((acc, ev) => {
    (acc[ev.eventDate] ??= []).push(ev);
    return acc;
  }, {});
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
 
export function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}
 
/** Add `days` to a "YYYY-MM-DD" string and return a new "YYYY-MM-DD" string. */
export function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toYMD(d);
}
 