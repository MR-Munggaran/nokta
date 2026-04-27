"use server";

import { db } from "@/db";
import { scheduleEvents } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { ScheduleEvent } from "@/db/schema";
import { shiftDateStr, toYMD } from "@/lib/scheduleUtils";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  title:     z.string().min(1, "Judul wajib diisi"),
  category:  z.enum(["work", "date", "health", "personal", "other"]).default("other"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  startTime: z.string().min(1, "Jam mulai wajib diisi"),
  endTime:   z.string().optional(),
  note:      z.string().optional(),
});

const updateSchema = createSchema.extend({
  id: z.number().int().positive(),
});

// ─── GET EVENTS (range) ───────────────────────────────────────────────────────

/**
 * Fetch all events for the couple within [from, to] inclusive (YYYY-MM-DD).
 * Pass no args to get all events.
 */
export async function getScheduleEvents(
  from?: string,
  to?: string,
): Promise<ScheduleEvent[]> {
  const session = await getSession();
  if (!session.ok) return [];

  const coupleId = session.coupleId as string;
  const conditions = [eq(scheduleEvents.coupleId, coupleId)];
  if (from) conditions.push(gte(scheduleEvents.eventDate, from));
  if (to)   conditions.push(lte(scheduleEvents.eventDate, to));

  return db
    .select()
    .from(scheduleEvents)
    .where(and(...conditions))
    .orderBy(scheduleEvents.eventDate, scheduleEvents.startTime);
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createScheduleEvent(
  input: unknown,
): Promise<ActionResult<ScheduleEvent>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal." };

  const { title, category, eventDate, startTime, endTime, note } = parsed.data;
  const coupleId = session.coupleId as string;

  const [event] = await db
    .insert(scheduleEvents)
    .values({
      coupleId,
      createdBy: session.userId,
      title,
      category,
      eventDate,
      startTime,
      endTime:   endTime ?? null,
      note:      note    ?? null,
    })
    .returning();

  revalidatePath("/schedule");
  return { success: true, data: event };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateScheduleEvent(
  input: unknown,
): Promise<ActionResult<ScheduleEvent>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validasi gagal." };

  const { id, title, category, eventDate, startTime, endTime, note } = parsed.data;
  const coupleId = session.coupleId as string;

  // Ownership check — only same couple
  const existing = await db.query.scheduleEvents.findFirst({
    where: and(
      eq(scheduleEvents.id,       id),
      eq(scheduleEvents.coupleId, coupleId),
    ),
  });
  if (!existing) return { success: false, error: "Event tidak ditemukan." };

  const [updated] = await db
    .update(scheduleEvents)
    .set({
      title,
      category,
      eventDate,
      startTime,
      endTime:   endTime ?? null,
      note:      note    ?? null,
      updatedAt: new Date(),
    })
    .where(eq(scheduleEvents.id, id))
    .returning();

  revalidatePath("/schedule");
  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteScheduleEvent(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const coupleId = session.coupleId as string;
  const existing = await db.query.scheduleEvents.findFirst({
    where: and(
      eq(scheduleEvents.id,       id),
      eq(scheduleEvents.coupleId, coupleId),
    ),
  });
  if (!existing) return { success: false, error: "Event tidak ditemukan." };

  await db.delete(scheduleEvents).where(eq(scheduleEvents.id, id));

  revalidatePath("/schedule");
  return { success: true, data: { id } };
}

export async function copyScheduleEvent(
  sourceId: number,
  targetDate: string,
): Promise<ActionResult<ScheduleEvent>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };
 
  const coupleId = session.coupleId as string;
 
  const source = await db.query.scheduleEvents.findFirst({
    where: and(
      eq(scheduleEvents.id,       sourceId),
      eq(scheduleEvents.coupleId, coupleId),
    ),
  });
  if (!source) return { success: false, error: "Event tidak ditemukan." };
 
  const [copied] = await db
    .insert(scheduleEvents)
    .values({
      coupleId,
      createdBy: session.userId,
      title:     source.title,
      category:  source.category,
      eventDate: targetDate,
      startTime: source.startTime,
      endTime:   source.endTime   ?? null,
      note:      source.note      ?? null,
    })
    .returning();
 
  revalidatePath("/schedule");
  return { success: true, data: copied };
}
 
// ─── COPY WEEK ────────────────────────────────────────────────────────────────
 
/**
 * Copy all events from the week containing `sourceDate`
 * to the equivalent days in the following week (or `offsetWeeks` weeks ahead).
 *
 * Returns the number of events copied.
 */
export async function copyWeekEvents(
  sourceWeekStart: string,   // Monday (or Sunday) of the source week – "YYYY-MM-DD"
  offsetWeeks: number = 1,
): Promise<ActionResult<{ count: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };
 
  const coupleId = session.coupleId as string;
 
  // Build date range for the source week (7 days)
  const from = sourceWeekStart;
  const to   = shiftDateStr(sourceWeekStart, 6);
 
  const sourceEvents = await db
    .select()
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.coupleId, coupleId),
        gte(scheduleEvents.eventDate, from),
        lte(scheduleEvents.eventDate, to),
      ),
    );
 
  if (sourceEvents.length === 0)
    return { success: false, error: "Tidak ada kegiatan di minggu ini." };
 
  const shiftDays = offsetWeeks * 7;
 
  const rows = sourceEvents.map((ev) => ({
    coupleId,
    createdBy: session.userId,
    title:     ev.title,
    category:  ev.category,
    eventDate: shiftDateStr(ev.eventDate, shiftDays),
    startTime: ev.startTime,
    endTime:   ev.endTime   ?? null,
    note:      ev.note      ?? null,
  }));
 
  await db.insert(scheduleEvents).values(rows);
  revalidatePath("/schedule");
  return { success: true, data: { count: rows.length } };
}
 
// ─── COPY MONTH ───────────────────────────────────────────────────────────────
 
/**
 * Copy all events from `sourceYear`/`sourceMonth` (0-indexed month)
 * to the next month (or `offsetMonths` months ahead).
 *
 * Dates that overflow (e.g. Jan 31 → Feb 28) are clamped to the last day
 * of the target month.
 */
export async function copyMonthEvents(
  sourceYear:   number,
  sourceMonth:  number,   // 0-indexed (0 = January)
  offsetMonths: number = 1,
): Promise<ActionResult<{ count: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };
 
  const coupleId = session.coupleId as string;
 
  const from = toYMD(new Date(sourceYear, sourceMonth, 1));
  const to   = toYMD(new Date(sourceYear, sourceMonth + 1, 0)); // last day
 
  const sourceEvents = await db
    .select()
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.coupleId, coupleId),
        gte(scheduleEvents.eventDate, from),
        lte(scheduleEvents.eventDate, to),
      ),
    );
 
  if (sourceEvents.length === 0)
    return { success: false, error: "Tidak ada kegiatan di bulan ini." };
 
  const targetYear  = sourceMonth + offsetMonths >= 12
    ? sourceYear + Math.floor((sourceMonth + offsetMonths) / 12)
    : sourceYear;
  const targetMonth = (sourceMonth + offsetMonths) % 12;
  const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
 
  const rows = sourceEvents.map((ev) => {
    const srcDay    = parseInt(ev.eventDate.split("-")[2], 10);
    const targetDay = Math.min(srcDay, lastDayOfTarget);
    return {
      coupleId,
      createdBy: session.userId,
      title:     ev.title,
      category:  ev.category,
      eventDate: toYMD(new Date(targetYear, targetMonth, targetDay)),
      startTime: ev.startTime,
      endTime:   ev.endTime   ?? null,
      note:      ev.note      ?? null,
    };
  });
 
  await db.insert(scheduleEvents).values(rows);
  revalidatePath("/schedule");
  return { success: true, data: { count: rows.length } };
}
