"use server";

import { db } from "@/db";
import { moodCheckins } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type MoodCheckin = InferSelectModel<typeof moodCheckins>;

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  moodScore: z.number().min(1).max(5),
  emoji:     z.string().min(1),
  note:      z.string().optional(),
});

// ─── GET TODAY ────────────────────────────────────────────────────────────────

export async function getTodayMoods(): Promise<{
  mine:    MoodCheckin | null;
  partner: MoodCheckin | null;
}> {
  const session = await getSession();
  if (!session.ok) return { mine: null, partner: null };

  const today = new Date().toISOString().split("T")[0];

  const checkins = await db.query.moodCheckins.findMany({
    where: and(
      eq(moodCheckins.coupleId, session.coupleId),
      eq(moodCheckins.date,     today),
    ),
  });

  const mine    = checkins.find((c) => c.userId === session.userId) ?? null;
  const partner = checkins.find((c) => c.userId !== session.userId) ?? null;

  return { mine, partner };
}

// ─── GET LAST 7 DAYS ──────────────────────────────────────────────────────────

export async function getLast7DaysMoods(): Promise<MoodCheckin[]> {
  const session = await getSession();
  if (!session.ok) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fromDate = sevenDaysAgo.toISOString().split("T")[0];

  return db.query.moodCheckins.findMany({
    where: and(
      eq(moodCheckins.coupleId, session.coupleId),
      gte(moodCheckins.date,    fromDate),
    ),
    orderBy: (t, { asc }) => [asc(t.date)],
  });
}

// ─── SUBMIT MOOD ──────────────────────────────────────────────────────────────

export async function submitMood(input: unknown): Promise<ActionResult<MoodCheckin>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const today = new Date().toISOString().split("T")[0];

  // Cek sudah check-in hari ini belum
  const existing = await db.query.moodCheckins.findFirst({
    where: and(
      eq(moodCheckins.coupleId, session.coupleId),
      eq(moodCheckins.userId,   session.userId),
      eq(moodCheckins.date,     today),
    ),
  });

  if (existing) {
    // Update check-in hari ini
    const [updated] = await db.update(moodCheckins)
      .set({
        moodScore: parsed.data.moodScore,
        emoji:     parsed.data.emoji,
        note:      parsed.data.note ?? null,
      })
      .where(eq(moodCheckins.id, existing.id))
      .returning();

    revalidatePath("/mood");
    return { success: true, data: updated };
  }

  const [checkin] = await db.insert(moodCheckins).values({
    coupleId:  session.coupleId,
    userId:    session.userId,
    moodScore: parsed.data.moodScore,
    emoji:     parsed.data.emoji,
    note:      parsed.data.note ?? null,
    date:      today,
  }).returning();

  revalidatePath("/mood");
  return { success: true, data: checkin };
}