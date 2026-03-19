"use server";

import { db } from "@/db";
import { couples, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { randomBytes } from "crypto";

// ─── CREATE COUPLE (Owner) ────────────────────────────────────────────────────

export async function createCouple(masterPassword: string) {
  const supabase_session = await getSession();
  if (!supabase_session.ok) return { success: false, error: supabase_session.error };
  if (supabase_session.coupleId) return { success: false, error: "Kamu sudah bergabung ke couple." };

  // Generate invite code 6 karakter
  const inviteCode = randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F9B2"

  // Generate salt untuk key derivation nanti (Sprint 2)
  const salt = randomBytes(32).toString("hex");

  const [couple] = await db.insert(couples).values({
    inviteCode,
    masterPasswordSalt: salt,
  }).returning();

  // Update user jadi owner
  await db.update(users)
    .set({ coupleId: couple.id, role: "owner" })
    .where(eq(users.id, supabase_session.userId));

  revalidatePath("/onboarding");
  return { success: true, inviteCode };
}

// ─── JOIN COUPLE (Partner) ────────────────────────────────────────────────────

export async function joinCouple(inviteCode: string, masterPassword: string) {
  const session = await getSession();
  if (!session.ok) return { success: false, error: session.error };
  if (session.coupleId) return { success: false, error: "Kamu sudah bergabung ke couple." };

  // Cari couple berdasarkan invite code
  const couple = await db.query.couples.findFirst({
    where: eq(couples.inviteCode, inviteCode.toUpperCase()),
  });

  if (!couple) return { success: false, error: "Kode invite tidak valid." };

  // Cek sudah ada 2 member belum
  const existingMembers = await db.query.users.findMany({
    where: eq(users.coupleId, couple.id),
  });

  if (existingMembers.length >= 2) {
    return { success: false, error: "Couple ini sudah penuh." };
  }

  // Join couple sebagai partner
  await db.update(users)
    .set({ coupleId: couple.id, role: "partner" })
    .where(eq(users.id, session.userId));

  revalidatePath("/dashboard");
  return { success: true };
}

// ─── GET COUPLE INFO ──────────────────────────────────────────────────────────

export async function getCoupleInfo() {
  const session = await getSession();
  if (!session.ok) return null;

  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, session.coupleId),
  });

  if (!couple) return null;

  const members = await db.query.users.findMany({
    where: eq(users.coupleId, couple.id),
    columns: { id: true, name: true, avatarUrl: true, role: true },
  });

  return { couple, members };
}