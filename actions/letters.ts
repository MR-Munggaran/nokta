"use server";

import { db } from "@/db";
import { coupleNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";

export type Letter = InferSelectModel<typeof coupleNotes>;

export type LetterWithAuthor = Letter & {
  author: { id: string; name: string };
};

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

const createSchema = z.object({
  title:   z.string().min(1, "Judul wajib diisi"),
  content: z.string().min(1, "Isi surat wajib diisi"),
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getLetters(): Promise<LetterWithAuthor[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.coupleNotes.findMany({
    where:   eq(coupleNotes.coupleId, session.coupleId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      author: { columns: { id: true, name: true } },
    },
  }) as Promise<LetterWithAuthor[]>;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createLetter(input: unknown): Promise<ActionResult<Letter>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const [letter] = await db.insert(coupleNotes).values({
    coupleId: session.coupleId,
    authorId: session.userId,
    title:    parsed.data.title,
    content:  parsed.data.content,
  }).returning();

  revalidatePath("/letters");
  return { success: true, data: letter };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateLetter(
  id: number,
  input: unknown,
): Promise<ActionResult<Letter>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  // Hanya author yang bisa edit
  const existing = await db.query.coupleNotes.findFirst({
    where: and(
      eq(coupleNotes.id,       id),
      eq(coupleNotes.coupleId, session.coupleId),
      eq(coupleNotes.authorId, session.userId),
    ),
  });

  if (!existing) return { success: false, error: "Surat tidak ditemukan atau bukan milikmu." };

  const [updated] = await db.update(coupleNotes)
    .set({
      title:     parsed.data.title,
      content:   parsed.data.content,
      updatedAt: new Date(),
    })
    .where(eq(coupleNotes.id, id))
    .returning();

  revalidatePath("/letters");
  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteLetter(id: number): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.coupleNotes.findFirst({
    where: and(
      eq(coupleNotes.id,       id),
      eq(coupleNotes.coupleId, session.coupleId),
      eq(coupleNotes.authorId, session.userId),
    ),
  });

  if (!existing) return { success: false, error: "Surat tidak ditemukan atau bukan milikmu." };

  await db.delete(coupleNotes).where(eq(coupleNotes.id, id));

  revalidatePath("/letters");
  return { success: true, data: { id } };
}