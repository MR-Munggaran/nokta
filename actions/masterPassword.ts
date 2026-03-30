"use server";

import { db } from "@/db";
import { couples, vaultItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deriveKey, generateSalt } from "@/lib/keyDerivation";
import { encrypt, decrypt } from "@/lib/crypto";
import { setEncryptionKey, clearEncryptionSession, lockSession } from "@/lib/session";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// In-memory store — resets on server restart.
// For production, use Redis or Supabase table.

const attemptStore = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000; // 15 menit

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now    = Date.now();
  const record = attemptStore.get(userId);

  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS };
}

function recordFailedAttempt(userId: string) {
  const now    = Date.now();
  const record = attemptStore.get(userId);

  if (!record || now >= record.resetAt) {
    attemptStore.set(userId, { count: 1, resetAt: now + LOCKOUT_MS });
  } else {
    record.count++;
  }
}

function clearAttempts(userId: string) {
  attemptStore.delete(userId);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Fetch the couple's master password salt.
 * Returns null if couple is not found.
 */
async function getCouplesSalt(coupleId: string): Promise<string | null> {
  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, coupleId),
    columns: { masterPasswordSalt: true },
  });
  return couple?.masterPasswordSalt ?? null;
}

/**
 * Verify a master password by attempting to decrypt an existing vault item.
 * If the vault is empty, verification is skipped (no data to validate against).
 * Returns the derived key if valid, throws if password is wrong.
 */
async function verifyMasterPassword(
  masterPassword: string,
  salt: string,
  coupleId: string,
): Promise<Buffer> {
  const key = deriveKey(masterPassword, salt);

  const testItem = await db.query.vaultItems.findFirst({
    where: eq(vaultItems.coupleId, coupleId),
  });

  if (testItem) {
    // Will throw if authTag doesn't match — i.e. wrong key
    decrypt(
      { ciphertext: testItem.encryptedData, iv: testItem.iv, authTag: testItem.authTag },
      key,
    );
  }

  return key;
}

// ─── SETUP MASTER PASSWORD ────────────────────────────────────────────────────

export async function setupMasterPassword(masterPassword: string) {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  if (masterPassword.length < 8) {
    return { success: false, error: "Master password minimal 8 karakter." };
  }

  const salt = generateSalt();
  const key  = deriveKey(masterPassword, salt);

  await db.update(couples)
    .set({ masterPasswordSalt: salt })
    .where(eq(couples.id, session.coupleId));

  await setEncryptionKey(key);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ─── UNLOCK ───────────────────────────────────────────────────────────────────

export async function unlockWithMasterPassword(
  masterPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  const { allowed, remaining } = checkRateLimit(session.userId);
  if (!allowed) {
    return {
      success: false,
      error:   "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.",
    };
  }

  const salt = await getCouplesSalt(session.coupleId);
  if (!salt) return { success: false, error: "Couple tidak ditemukan." };

  try {
    const key = await verifyMasterPassword(masterPassword, salt, session.coupleId);
    await setEncryptionKey(key);
    clearAttempts(session.userId);
    return { success: true };
  } catch {
    recordFailedAttempt(session.userId);
    return {
      success: false,
      error:   remaining > 1
        ? `Master password salah. Sisa percobaan: ${remaining - 1}`
        : "Master password salah. Ini percobaan terakhirmu.",
    };
  }
}

// ─── LOCK ─────────────────────────────────────────────────────────────────────

export async function lock() {
  await lockSession();
  revalidatePath("/");
}

// ─── CHANGE MASTER PASSWORD ───────────────────────────────────────────────────

export async function changeMasterPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  if (newPassword.length < 8) {
    return { success: false, error: "Master password baru minimal 8 karakter." };
  }

  const salt = await getCouplesSalt(session.coupleId);
  if (!salt) return { success: false, error: "Couple tidak ditemukan." };

  // 1. Verify current password dan derive old key
  let oldKey: Buffer;
  try {
    oldKey = await verifyMasterPassword(currentPassword, salt, session.coupleId);
  } catch {
    return { success: false, error: "Master password lama salah." };
  }

  // 2. Fetch semua vault items
  const items = await db.query.vaultItems.findMany({
    where: eq(vaultItems.coupleId, session.coupleId),
  });

  // 3. Decrypt semua dengan key lama
  let decryptedItems: { id: number; data: unknown }[];
  try {
    decryptedItems = items.map((item) => ({
      id:   item.id,
      data: decrypt(
        { ciphertext: item.encryptedData, iv: item.iv, authTag: item.authTag },
        oldKey,
      ),
    }));
  } catch {
    return {
      success: false,
      error:   "Gagal mendekripsi data lama. Pastikan master password lama benar.",
    };
  }

  // 4. Generate salt + key baru
  const newSalt = generateSalt();
  const newKey  = deriveKey(newPassword, newSalt);

  // 5. Re-encrypt semua dengan key baru
  const reEncrypted = decryptedItems.map(({ id, data }) => {
    const { ciphertext, iv, authTag } = encrypt(data, newKey);
    return { id, ciphertext, iv, authTag };
  });

  // 6. Atomically update DB
  await db.transaction(async (tx) => {
    await tx.update(couples)
      .set({ masterPasswordSalt: newSalt })
      .where(eq(couples.id, session.coupleId));

    for (const item of reEncrypted) {
      await tx.update(vaultItems)
        .set({
          encryptedData: item.ciphertext,
          iv:            item.iv,
          authTag:       item.authTag,
          updatedAt:     new Date(),
        })
        .where(eq(vaultItems.id, item.id));
    }
  });

  // 7. Update session dengan key baru
  await setEncryptionKey(newKey);

  return { success: true };
}

// ─── RESET MASTER PASSWORD ────────────────────────────────────────────────────
// Menghapus semua vault items dan mereset salt.
// Digunakan saat user lupa master password.
// Data vault TIDAK bisa dipulihkan setelah reset.

export async function resetMasterPassword(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  await db.transaction(async (tx) => {
    await tx.delete(vaultItems)
      .where(eq(vaultItems.coupleId, session.coupleId));

    await tx.update(couples)
      .set({ masterPasswordSalt: "pending" })
      .where(eq(couples.id, session.coupleId));
  });

  await clearEncryptionSession();
  return { success: true };
}

// ─── CLEAR SESSION (logout) ───────────────────────────────────────────────────

export async function clearMasterPasswordSession() {
  await clearEncryptionSession();
}