"use server";

import { db } from "@/db";
import { vaultItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt, type EncryptedPayload } from "@/lib/crypto";
import { getEncryptionKey } from "@/lib/session";
import { getSession } from "./auth";
import {
  createVaultItemSchema,
  updateVaultItemSchema,
  type CredentialData,
  type DocumentData,
  type NoteData,
} from "@/lib/validations";
import type { InferSelectModel } from "drizzle-orm";

export type VaultItem = InferSelectModel<typeof vaultItems>;

export type DecryptedVaultItem = Omit<VaultItem, "encryptedData" | "iv" | "authTag"> & {
  data:  CredentialData | DocumentData | NoteData;
  owner: { id: string; name: string };
  isOwn: boolean;
};

type AuthenticatedSession = Extract<Awaited<ReturnType<typeof getSession>>, { ok: true }>;

type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function requireKeyAndSession(): Promise<
  | { session: AuthenticatedSession; key: Buffer }
  | { error: string }
> {
  const [session, key] = await Promise.all([getSession(), getEncryptionKey()]);
  if (!session.ok) return { error: session.error };
  if (!key)        return { error: "Vault terkunci. Masukkan master password." as const };
  return { session, key };
}

function decryptItem(
  item: VaultItem & { owner: { id: string; name: string } },
  key: Buffer,
  currentUserId: string,
): DecryptedVaultItem {
  const payload: EncryptedPayload = {
    ciphertext: item.encryptedData,
    iv:         item.iv,
    authTag:    item.authTag,
  };
  const data = decrypt<CredentialData | DocumentData | NoteData>(payload, key);

  return {
    id:        item.id,
    coupleId:  item.coupleId,
    ownerId:   item.ownerId,
    type:      item.type,
    name:      item.name,
    shared:    item.shared,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    owner:     item.owner,
    isOwn:     item.ownerId === currentUserId,
    data,
  };
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────

export async function getVaultItems(): Promise<ActionResult<DecryptedVaultItem[]>> {
  const ctx = await requireKeyAndSession();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { session, key } = ctx;

  const items = await db.query.vaultItems.findMany({
    where:   eq(vaultItems.coupleId, session.coupleId),
    orderBy: (v, { desc }) => [desc(v.createdAt)],
    with: {
      owner: { columns: { id: true, name: true } },
    },
  });

  const visible = items.filter(
    (item) => item.ownerId === session.userId || item.shared
  );

  try {
    const decrypted = visible.map((item) => decryptItem(item, key, session.userId));
    return { success: true, data: decrypted };
  } catch {
    return { success: false, error: "Gagal mendekripsi vault. Cek master password." };
  }
}

// ─── GET BY TYPE ──────────────────────────────────────────────────────────────

export async function getVaultItemsByType(
  type: "credential" | "document" | "note"
): Promise<ActionResult<DecryptedVaultItem[]>> {
  const result = await getVaultItems();
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.filter((item) => item.type === type),
  };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createVaultItem(input: unknown): Promise<ActionResult<VaultItem>> {
  const ctx = await requireKeyAndSession();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { session, key } = ctx;

  const parsed = createVaultItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { type, name, shared, data } = parsed.data;
  const { ciphertext, iv, authTag } = encrypt(data, key);

  const [item] = await db.insert(vaultItems).values({
    coupleId:      session.coupleId,
    ownerId:       session.userId,
    type,
    name,
    shared,
    encryptedData: ciphertext,
    iv,
    authTag,
  }).returning();

  revalidatePath("/vault");
  return { success: true, data: item };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateVaultItem(input: unknown): Promise<ActionResult<VaultItem>> {
  const ctx = await requireKeyAndSession();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { session, key } = ctx;

  const parsed = updateVaultItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validasi gagal." };

  const { id, name, shared, data } = parsed.data;

  const existing = await db.query.vaultItems.findFirst({
    where: and(
      eq(vaultItems.id, id),
      eq(vaultItems.coupleId, session.coupleId),
      eq(vaultItems.ownerId, session.userId),
    ),
  });

  if (!existing) return { success: false, error: "Item tidak ditemukan atau bukan milikmu." };

  const { ciphertext, iv, authTag } = encrypt(data, key);

  const [updated] = await db.update(vaultItems)
    .set({ name, shared, encryptedData: ciphertext, iv, authTag, updatedAt: new Date() })
    .where(eq(vaultItems.id, id))
    .returning();

  revalidatePath("/vault");
  return { success: true, data: updated };
}

// ─── TOGGLE SHARED ────────────────────────────────────────────────────────────

export async function toggleVaultItemShared(id: number): Promise<ActionResult<VaultItem>> {
  const ctx = await requireKeyAndSession();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { session } = ctx;

  const existing = await db.query.vaultItems.findFirst({
    where: and(
      eq(vaultItems.id, id),
      eq(vaultItems.coupleId, session.coupleId),
      eq(vaultItems.ownerId, session.userId),
    ),
  });

  if (!existing) return { success: false, error: "Item tidak ditemukan atau bukan milikmu." };

  const [updated] = await db.update(vaultItems)
    .set({ shared: !existing.shared, updatedAt: new Date() })
    .where(eq(vaultItems.id, id))
    .returning();

  revalidatePath("/vault");
  return { success: true, data: updated };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteVaultItem(id: number): Promise<ActionResult<{ id: number }>> {
  const ctx = await requireKeyAndSession();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { session } = ctx;

  const existing = await db.query.vaultItems.findFirst({
    where: and(
      eq(vaultItems.id, id),
      eq(vaultItems.coupleId, session.coupleId),
      eq(vaultItems.ownerId, session.userId),
    ),
  });

  if (!existing) return { success: false, error: "Item tidak ditemukan atau bukan milikmu." };

  await db.delete(vaultItems).where(eq(vaultItems.id, id));

  revalidatePath("/vault");
  return { success: true, data: { id } };
}
