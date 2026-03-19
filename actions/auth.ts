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

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function register(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const { name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) return { success: false, error: error?.message ?? "Registrasi gagal." };

  // Insert user profile ke tabel users
  await db.insert(users).values({
    id:    data.user.id,
    email,
    name,
  });

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

  // Cek apakah user sudah punya couple
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Login gagal." };

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!profile?.coupleId) {
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

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!profile) return { ok: false as const, error: "User tidak ditemukan." };
  if (!profile.coupleId) return { ok: false as const, error: "Belum bergabung ke couple." };

  return {
    ok:       true as const,
    userId:   profile.id,
    coupleId: profile.coupleId,
    name:     profile.name,
    role:     profile.role,
  };
}