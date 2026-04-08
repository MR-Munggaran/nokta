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
  image:       z.string().optional(), // ✅ tambah ini
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

  const { title, description, category, image } = parsed.data;

  const [item] = await db.insert(bucketListItems).values({
    coupleId:    session.coupleId,
    createdBy:   session.userId,
    title,
    description: description ?? null,
    category,
    image:       image ?? null,
  }).returning();

  revalidatePath("/bucket-list");

  return { success: true, data: item };
}

export async function updateBucketItem(
  id: number,
  payload: Partial<Pick<BucketItem, "image" | "title" | "description" | "category">>
): Promise<ActionResult<BucketItem>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.bucketListItems.findFirst({
    where: and(
      eq(bucketListItems.id, id),
      eq(bucketListItems.coupleId, session.coupleId),
    ),
  });

  if (!existing) {
    return { success: false, error: "Item tidak ditemukan." };
  }

  // 🧠 handle image replacement
  if ("image" in payload && existing.image && payload.image && existing.image !== payload.image) {
    try {
      const { deleteFromCloudinary } = await import("@/lib/uploadToCloudinary");
      await deleteFromCloudinary(existing.image);
    } catch (err) {
      console.warn("Gagal hapus image lama:", err);
    }
  }

  const [updated] = await db.update(bucketListItems)
    .set(payload)
    .where(eq(bucketListItems.id, id))
    .returning();

  revalidatePath("/bucket-list");

  return { success: true, data: updated };
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

  if (existing.image) {
    try {
      const { deleteFromCloudinary } = await import("@/lib/uploadToCloudinary");
      await deleteFromCloudinary(existing.image);
    } catch (err) {
      console.warn("Gagal hapus image:", err);
    }
  }

  await db.delete(bucketListItems).where(eq(bucketListItems.id, id));

  revalidatePath("/bucket-list");

  return { success: true, data: { id } };
}