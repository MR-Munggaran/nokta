"use server";

import { db } from "@/db";
import { coupleNotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";
import { sendDiscordNotification } from "@/lib/discord";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

export type Letter = InferSelectModel<typeof coupleNotes>;

export type LetterWithAuthor = Letter & {
  author: { id: string; name: string };
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const createSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  content: z.string().min(1, "Isi surat wajib diisi"),
  image: z.any().optional(),
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getLetters(): Promise<LetterWithAuthor[]> {
  const session = await getSession();
  if (!session.ok) return [];

  return db.query.coupleNotes.findMany({
    where: eq(coupleNotes.coupleId, session.coupleId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      author: { columns: { id: true, name: true } },
    },
  }) as Promise<LetterWithAuthor[]>;
}

// ─── GET BY ID (FIXED) ────────────────────────────────────────────────────────

export async function getLetterById(id: number): Promise<LetterWithAuthor | null> {
  const session = await getSession();
  if (!session.ok) return null;

  return (await db.query.coupleNotes.findFirst({
    where: and(
      eq(coupleNotes.id, id),
      eq(coupleNotes.coupleId, session.coupleId),
    ),
    with: {
      author: { columns: { id: true, name: true } },
    },
  })) as LetterWithAuthor | null;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createLetter(input: FormData): Promise<ActionResult<Letter>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const title = input.get("title") as string;
  const content = input.get("content") as string;
  const file = input.get("image") as File | null;

  if (!title || !content) {
    return { success: false, error: "Validasi gagal." };
  }

  let imageUrl: string | null = null;

  // 🔥 upload image kalau ada
  if (file && file.size > 0) {
    try {
      imageUrl = await uploadToCloudinary(file, "letters");
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Upload gagal",
      };
    }
  }

  const [letter] = await db.insert(coupleNotes).values({
    coupleId: session.coupleId,
    authorId: session.userId,
    title,
    content,
    imageUrl,
  }).returning();

  // 🔥 Tambahin ini
  await sendDiscordNotification({
    username: "Nokta 💕",
    embeds: [
      {
        title: "💌 Surat Baru Masuk!",
        url: `https://nokta.life/letters/${letter.id}`,
        description:
          letter.content.slice(0, 150) +
          (letter.content.length > 150 ? "..." : ""),
        color: 0xE4004B,

        fields: [
          {
            name: "👤 Pengirim",
            value: `${session.userId}`,
            inline: true,
          },
          {
            name: "📝 Judul",
            value: letter.title,
            inline: true,
          },
        ],

        // 🔥 IMAGE DI DISCORD
        ...(imageUrl && {
          image: {
            url: imageUrl,
          },
        }),

        footer: {
          text: "Klik judul untuk membuka 💕",
        },

        timestamp: new Date().toISOString(),
      },
    ],
  });

  revalidatePath("/letters");
  return { success: true, data: letter };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateLetter(
  id: number,
  input: unknown
): Promise<ActionResult<Letter>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const existing = await db.query.coupleNotes.findFirst({
    where: and(
      eq(coupleNotes.id, id),
      eq(coupleNotes.coupleId, session.coupleId),
      eq(coupleNotes.authorId, session.userId),
    ),
  });

  if (!existing) {
    return { success: false, error: "Surat tidak ditemukan atau bukan milikmu." };
  }

  const [updated] = await db.update(coupleNotes)
    .set({
      title: parsed.data.title,
      content: parsed.data.content,
      updatedAt: new Date(),
    })
    .where(eq(coupleNotes.id, id))
    .returning();

  revalidatePath("/letters");
  revalidatePath(`/letters/${id}`);

  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteLetter(
  id: number
): Promise<ActionResult<{ id: number }>> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const existing = await db.query.coupleNotes.findFirst({
    where: and(
      eq(coupleNotes.id, id),
      eq(coupleNotes.coupleId, session.coupleId),
      eq(coupleNotes.authorId, session.userId),
    ),
  });

  if (!existing) {
    return { success: false, error: "Surat tidak ditemukan atau bukan milikmu." };
  }

  await db.delete(coupleNotes).where(eq(coupleNotes.id, id));

  revalidatePath("/letters");

  return { success: true, data: { id } };
}