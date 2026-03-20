"use server";

import { db } from "@/db";
import { specialDates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type SpecialDate = InferSelectModel<typeof specialDates>;

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  title:           z.string().min(1, "Judul wajib diisi"),
  emoji:           z.string().default("🗓️"),
  date:            z.string().min(1, "Tanggal wajib diisi"),
  recurringYearly: z.boolean().default(true),
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getSpecialDates(): Promise<SpecialDate[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.specialDates.findMany({
    where:   eq(specialDates.coupleId, session.coupleId),
    orderBy: (t, { asc }) => [asc(t.date)],
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createSpecialDate(input: unknown): Promise<ActionResult<SpecialDate>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { title, emoji, date, recurringYearly } = parsed.data;

  const [item] = await db.insert(specialDates).values({
    coupleId:        session.coupleId,
    title,
    emoji,
    date,
    recurringYearly,
  }).returning();

  revalidatePath("/dates");
  return { success: true, data: item };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateSpecialDate(
  id: number,
  input: unknown,
): Promise<ActionResult<SpecialDate>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const existing = await db.query.specialDates.findFirst({
    where: and(
      eq(specialDates.id, id),
      eq(specialDates.coupleId, session.coupleId),
    ),
  });

  if (!existing) return { success: false, error: "Tanggal tidak ditemukan." };

  const [updated] = await db.update(specialDates)
    .set(parsed.data)
    .where(eq(specialDates.id, id))
    .returning();

  revalidatePath("/dates");
  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteSpecialDate(id: number): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.specialDates.findFirst({
    where: and(
      eq(specialDates.id, id),
      eq(specialDates.coupleId, session.coupleId),
    ),
  });

  if (!existing) return { success: false, error: "Tanggal tidak ditemukan." };

  await db.delete(specialDates).where(eq(specialDates.id, id));

  revalidatePath("/dates");
  return { success: true, data: { id } };
}