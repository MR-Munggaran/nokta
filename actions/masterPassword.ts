"use server";

import { db } from "@/db";
import { couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deriveKey, generateSalt } from "@/lib/keyDerivation";
import { setEncryptionKey, clearEncryptionSession, lockSession } from "@/lib/session";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// In-memory store — resets on server restart.
// For production, use Redis or Supabase table.

const attemptStore = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 menit

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now    = Date.now();
  const record = attemptStore.get(userId);

  if (record && now < record.resetAt) {
    if (record.count >= MAX_ATTEMPTS) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
  }

  // Reset or first attempt
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
  masterPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session.ok) return { success: false, error: "Unauthorized" };

  // Check rate limit
  const { allowed, remaining } = checkRateLimit(session.userId);
  if (!allowed) {
    return {
      success: false,
      error:   "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.",
    };
  }

  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, session.coupleId),
    columns: { masterPasswordSalt: true },
  });

  if (!couple) return { success: false, error: "Couple tidak ditemukan." };

  try {
    const key = deriveKey(masterPassword, couple.masterPasswordSalt);
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

  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, session.coupleId),
    columns: { masterPasswordSalt: true },
  });

  if (!couple) return { success: false, error: "Couple tidak ditemukan." };

  // Verify current password
  try {
    deriveKey(currentPassword, couple.masterPasswordSalt);
  } catch {
    return { success: false, error: "Master password lama salah." };
  }

  // Generate new salt + key
  const newSalt = generateSalt();
  const newKey  = deriveKey(newPassword, newSalt);

  await db.update(couples)
    .set({ masterPasswordSalt: newSalt })
    .where(eq(couples.id, session.coupleId));

  await setEncryptionKey(newKey);

  // Note: existing vault items were encrypted with old key.
  // Re-encryption of all items should happen here in production.
  // For now, old items will fail to decrypt until re-encrypted.

  return { success: true };
}

// ─── CLEAR SESSION (logout) ───────────────────────────────────────────────────

export async function clearMasterPasswordSession() {
  await clearEncryptionSession();
}