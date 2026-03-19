import { redirect } from "next/navigation";
import { getEncryptionKey } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AutoLockProvider } from "@/components/security/AutoLockProvider";
import { UnlockModal } from "@/components/security/UnlockModal";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Belum login
  if (!user) redirect("/login");

  // Ambil profile
  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!profile) redirect("/login");

  // Belum punya couple
  if (!profile.coupleId) redirect("/onboarding");

  // Cek master password sudah di-setup
  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, profile.coupleId),
    columns: { masterPasswordSalt: true },
  });

  const hasSetupMasterPassword =
    couple?.masterPasswordSalt &&
    couple.masterPasswordSalt !== "pending" &&
    couple.masterPasswordSalt.length > 10;

  if (!hasSetupMasterPassword) redirect("/onboarding");

  // Cek vault terkunci
  const key      = await getEncryptionKey();
  const isLocked = !key;

  return (
    <AutoLockProvider>
      <div className="min-h-dvh bg-[#F7F6F3]">
        <main className="max-w-md mx-auto px-4 pt-6 pb-[calc(72px+1.5rem)]">
          {children}
        </main>
        <BottomNav />
      </div>
      {isLocked && <UnlockModal />}
    </AutoLockProvider>
  );
}