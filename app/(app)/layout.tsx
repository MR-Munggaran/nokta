import { redirect } from "next/navigation";
import { getEncryptionKey } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, couples } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AutoLockProvider } from "@/components/security/AutoLockProvider";
import { UnlockModal } from "@/components/security/UnlockModal";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!profile) redirect("/login");
  if (!profile.coupleId) redirect("/onboarding");

  const couple = await db.query.couples.findFirst({
    where:   eq(couples.id, profile.coupleId),
    columns: { masterPasswordSalt: true },
  });

  const hasSetupMasterPassword =
    couple?.masterPasswordSalt &&
    couple.masterPasswordSalt !== "pending" &&
    couple.masterPasswordSalt.length > 10;

  if (!hasSetupMasterPassword) redirect("/onboarding");

  const key      = await getEncryptionKey();
  const isLocked = !key;

  return (
    <AutoLockProvider>
      <div className="min-h-dvh bg-[#F7F6F3] flex">

        {/* Sidebar — desktop only */}
        <Sidebar name={profile.name} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 w-full max-w-2xl md:max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">
            {children}
          </main>

          {/* Bottom nav — mobile only */}
          <BottomNav />
        </div>

      </div>
      {isLocked && <UnlockModal />}
    </AutoLockProvider>
  );
}