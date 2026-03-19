"use server";

import { db } from "@/db";
import { bucketListItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type BucketItem = InferSelectModel<typeof bucketListItems>;

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  title:       z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  category:    z.string().default("general"),
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getBucketList(): Promise<BucketItem[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.bucketListItems.findMany({
    where:   eq(bucketListItems.coupleId, session.coupleId),
    orderBy: (t, { asc, desc }) => [asc(t.completed), desc(t.createdAt)],
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createBucketItem(input: unknown): Promise<ActionResult<BucketItem>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { title, description, category } = parsed.data;

  const [item] = await db.insert(bucketListItems).values({
    coupleId:    session.coupleId,
    createdBy:   session.userId,
    title,
    description: description ?? null,
    category,
  }).returning();

  revalidatePath("/bucket-list");
  return { success: true, data: item };
}

// ─── TOGGLE COMPLETE ──────────────────────────────────────────────────────────

export async function toggleBucketItem(id: number): Promise<ActionResult<BucketItem>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.bucketListItems.findFirst({
    where: and(
      eq(bucketListItems.id, id),
      eq(bucketListItems.coupleId, session.coupleId),
    ),
  });

  if (!existing) return { success: false, error: "Item tidak ditemukan." };

  const [updated] = await db.update(bucketListItems)
    .set({
      completed:   !existing.completed,
      completedBy: !existing.completed ? session.userId : null,
      completedAt: !existing.completed ? new Date() : null,
    })
    .where(eq(bucketListItems.id, id))
    .returning();

  revalidatePath("/bucket-list");
  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteBucketItem(id: number): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.bucketListItems.findFirst({
    where: and(
      eq(bucketListItems.id, id),
      eq(bucketListItems.coupleId, session.coupleId),
    ),
  });

  if (!existing) return { success: false, error: "Item tidak ditemukan." };

  await db.delete(bucketListItems).where(eq(bucketListItems.id, id));

  revalidatePath("/bucket-list");
  return { success: true, data: { id } };
}