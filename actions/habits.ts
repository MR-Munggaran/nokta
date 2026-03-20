"use server";

import { db } from "@/db";
import { habits, habitLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type Habit    = InferSelectModel<typeof habits>;
export type HabitLog = InferSelectModel<typeof habitLogs>;

export type HabitWithLogs = Habit & {
  logs: HabitLog[];
};

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  title:     z.string().min(1, "Judul wajib diisi"),
  emoji:     z.string().default("✅"),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
});

// ─── GET ALL WITH LOGS ────────────────────────────────────────────────────────

export async function getHabits(): Promise<HabitWithLogs[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.habits.findMany({
    where:   eq(habits.coupleId, session.coupleId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    with: {
      logs: true,
    },
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createHabit(input: unknown): Promise<ActionResult<Habit>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { title, emoji, frequency } = parsed.data;

  const [habit] = await db.insert(habits).values({
    coupleId:  session.coupleId,
    createdBy: session.userId,
    title,
    emoji,
    frequency,
  }).returning();

  revalidatePath("/habits");
  return { success: true, data: habit };
}

// ─── LOG HABIT (toggle) ───────────────────────────────────────────────────────

export async function toggleHabitLog(habitId: number): Promise<ActionResult<{ logged: boolean }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Cek apakah sudah log hari ini
  const existing = await db.query.habitLogs.findFirst({
    where: and(
      eq(habitLogs.habitId, habitId),
      eq(habitLogs.userId,   session.userId),
      eq(habitLogs.date,     today),
    ),
  });

  if (existing) {
    // Sudah log → hapus (un-log)
    await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
    revalidatePath("/habits");
    return { success: true, data: { logged: false } };
  } else {
    // Belum log → tambah
    await db.insert(habitLogs).values({
      habitId,
      userId: session.userId,
      date:   today,
    });
    revalidatePath("/habits");
    return { success: true, data: { logged: true } };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteHabit(id: number): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.habits.findFirst({
    where: and(
      eq(habits.id, id),
      eq(habits.coupleId, session.coupleId),
    ),
  });

  if (!existing) return { success: false, error: "Habit tidak ditemukan." };

  await db.delete(habits).where(eq(habits.id, id));

  revalidatePath("/habits");
  return { success: true, data: { id } };
}