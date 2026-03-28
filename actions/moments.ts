"use server";

import { db } from "@/db";
import { moments, momentImages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type Moment      = InferSelectModel<typeof moments>;
export type MomentImage = InferSelectModel<typeof momentImages>;
export type MomentWithRelations = Moment & {
  uploader: { id: string; name: string; avatarUrl: string | null };
  images:   MomentImage[];
};

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  imageUrl:  z.string().url("URL foto tidak valid"),
  imageUrls: z.array(z.string().url()).default([]),
  caption:   z.string().optional(),
  date:      z.coerce.date().optional(),
});

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function getMoments(limit = 50): Promise<MomentWithRelations[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.moments.findMany({
    where:   eq(moments.coupleId, session.coupleId),
    orderBy: desc(moments.createdAt),
    limit,
    with: {
      uploader: { columns: { id: true, name: true, avatarUrl: true } },
      images:   true,
    },
  }) as Promise<MomentWithRelations[]>;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createMoment(input: unknown): Promise<ActionResult<Moment>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { imageUrl, imageUrls, caption, date } = parsed.data;

  try {
    const [moment] = await db.insert(moments).values({
      coupleId:   session.coupleId,
      uploaderId: session.userId,
      imageUrl,
      caption:    caption ?? null,
      date:       date ?? new Date(),
    }).returning();

    // Insert foto tambahan (index 0 sudah jadi cover di moments.imageUrl)
    if (imageUrls.length > 0) {
      await db.insert(momentImages).values(
        imageUrls.map((url, i) => ({
          momentId: moment.id,
          imageUrl: url,
          order:    i,
        }))
      );
    }

    revalidatePath("/moments");
    return { success: true, data: moment };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Gagal menyimpan momen." };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteMoment(id: number): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const moment = await db.query.moments.findFirst({
    where: and(eq(moments.id, id), eq(moments.coupleId, session.coupleId)),
    with: { images: true },
  });

  if (!moment) return { success: false, error: "Momen tidak ditemukan." };

  if (moment.uploaderId !== session.userId && session.role !== "owner") {
    return { success: false, error: "Kamu tidak punya akses untuk menghapus momen ini." };
  }

  // Kumpulkan semua URL yang perlu dihapus dari Cloudinary
  const allUrls = [
    moment.imageUrl,
    ...moment.images.map((img) => img.imageUrl),
  ];

  // Hapus dari DB dulu (moment_images terhapus otomatis via CASCADE)
  await db.delete(moments)
    .where(and(eq(moments.id, id), eq(moments.coupleId, session.coupleId)));

  // Hapus dari Cloudinary secara parallel (fire and forget — tidak block response)
  const { deleteFromCloudinary } = await import("@/lib/uploadToCloudinary");
  Promise.all(allUrls.map((url) => deleteFromCloudinary(url).catch(console.error)));

  revalidatePath("/moments");
  return { success: true, data: { id } };
}