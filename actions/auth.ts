"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

const registerSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

type SessionOk = {
  ok:       true;
  userId:   string;
  coupleId: string;
  name:     string;
  role:     string | null;
};

type SessionError = {
  ok:    false;
  error: string;
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function register(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const { name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { success: false, error: error?.message ?? "Registrasi gagal." };

  // Cek apakah profile sudah ada (percobaan register sebelumnya)
  const existing = await db.query.users.findFirst({
    where: eq(users.id, data.user.id),
  });

  if (!existing) {
    await db.insert(users).values({
      id:    data.user.id,
      email,
      name,
    });
  }

  redirect("/onboarding");
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: "Email atau password salah." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Login gagal." };

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  // Belum punya couple → onboarding
  if (!profile?.coupleId) {
    redirect("/onboarding");
  }

  // Punya couple, cek apakah master password sudah di-setup
  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, profile.coupleId),
    columns: { masterPasswordSalt: true },
  });

  const hasSetupMasterPassword =
    couple?.masterPasswordSalt &&
    couple.masterPasswordSalt !== "pending" &&
    couple.masterPasswordSalt.length > 10;

  if (!hasSetupMasterPassword) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── GET SESSION ──────────────────────────────────────────────────────────────

export async function getSession(): Promise<SessionOk | SessionError> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!profile)          return { ok: false as const, error: "User tidak ditemukan." };
  if (!profile.coupleId) return { ok: false as const, error: "Belum bergabung ke couple." };

  return {
    ok:       true as const,
    userId:   profile.id,
    coupleId: profile.coupleId!,
    name:     profile.name,
    role:     profile.role,
  };
}