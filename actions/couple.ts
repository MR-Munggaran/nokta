"use server";

import { db } from "@/db";
import { couples, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  return profile ?? null;
}

// ─── CREATE COUPLE (Owner) ────────────────────────────────────────────────────

export async function createCouple() {
  const profile = await getCurrentUser();
  if (!profile) return { success: false, error: "Unauthorized" };
  if (profile.coupleId) return { success: false, error: "Kamu sudah bergabung ke couple." };

  const inviteCode = randomBytes(3).toString("hex").toUpperCase();

  // Salt "pending" — akan diisi setupMasterPassword()
  const [couple] = await db.insert(couples).values({
    inviteCode,
    masterPasswordSalt: "pending",
  }).returning();

  await db.update(users)
    .set({ coupleId: couple.id, role: "owner" })
    .where(eq(users.id, profile.id));

  revalidatePath("/onboarding");
  return { success: true, inviteCode };
}

// ─── JOIN COUPLE (Partner) ────────────────────────────────────────────────────

export async function joinCouple(inviteCode: string) {
  const profile = await getCurrentUser();
  if (!profile) return { success: false, error: "Unauthorized" };
  if (profile.coupleId) return { success: false, error: "Kamu sudah bergabung ke couple." };

  const couple = await db.query.couples.findFirst({
    where: eq(couples.inviteCode, inviteCode.toUpperCase()),
  });

  if (!couple) return { success: false, error: "Kode invite tidak valid." };

  const existingMembers = await db.query.users.findMany({
    where: eq(users.coupleId, couple.id),
  });

  if (existingMembers.length >= 2) {
    return { success: false, error: "Couple ini sudah penuh." };
  }

  await db.update(users)
    .set({ coupleId: couple.id, role: "partner" })
    .where(eq(users.id, profile.id));

  revalidatePath("/onboarding");
  return { success: true };
}

// ─── GET COUPLE INFO ──────────────────────────────────────────────────────────

export async function getCoupleInfo() {
  const profile = await getCurrentUser();
  if (!profile?.coupleId) return null;

  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, profile.coupleId),
  });

  if (!couple) return null;

  const members = await db.query.users.findMany({
    where:   eq(users.coupleId, couple.id),
    columns: { id: true, name: true, avatarUrl: true, role: true },
  });

  return { couple, members };
}