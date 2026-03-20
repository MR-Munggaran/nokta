import { Suspense } from "react";
import { getSession } from "@/actions/auth";
import { getCoupleInfo } from "@/actions/couple";
import { getSpecialDates } from "@/actions/dates";
import { getHabits } from "@/actions/habits";
import { getTodayMoods } from "@/actions/mood";
import { getBucketList } from "@/actions/bucketList";
import { getDaysUntil } from "@/lib/dateUtils";
import { Shield, ListChecks, Activity, BookHeart, ArrowRight, Flame } from "lucide-react";
import { CountdownWidget } from "@/components/dates/CountdownWidget";
import Link from "next/link";

// ─── WIDGET COMPONENTS (async) ────────────────────────────────────────────────

async function CountdownSection() {
  const dates = await getSpecialDates();
  const nearest = [...dates]
    .map((d) => ({ ...d, days: getDaysUntil(d.date, d.recurringYearly) }))
    .filter((d) => d.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  if (!nearest) {
    return (
      <Link href="/dates" className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 hover:bg-stone-50 transition-colors active:scale-[0.97]">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Countdown</span>
        <p className="text-xs text-stone-400 mt-1">Belum ada tanggal spesial</p>
        <p className="text-[11px] text-rose-400 font-medium mt-auto">Tambah sekarang →</p>
      </Link>
    );
  }

  return (
    <CountdownWidget
      days={nearest.days}
      title={nearest.title}
      emoji={nearest.emoji}
      recurringYearly={nearest.recurringYearly}
    />
  );
}

async function MoodSection({ userId, partnerId, partnerName }: {
  userId: string; partnerId?: string; partnerName?: string;
}) {
  const { mine, partner: partnerMood } = await getTodayMoods();
  return (
    <Link href="/mood" className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 hover:bg-stone-50 transition-colors active:scale-[0.97]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Mood</span>
        <span className="text-sm">💭</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl">{mine?.emoji ?? "—"}</span>
          <span className="text-[10px] text-stone-400">Kamu</span>
        </div>
        {partnerId && (
          <>
            <div className="w-px h-8 bg-stone-100" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl">{partnerMood?.emoji ?? "—"}</span>
              <span className="text-[10px] text-stone-400">{partnerName}</span>
            </div>
          </>
        )}
      </div>
      {!mine && (
        <p className="text-[11px] text-indigo-400 font-medium">Check-in sekarang →</p>
      )}
    </Link>
  );
}

async function HabitSection({ userId }: { userId: string }) {
  const today  = new Date().toISOString().split("T")[0];
  const habits = await getHabits();
  const total  = habits.length;
  const done   = habits.filter((h) =>
    h.logs.some((l) => l.userId === userId && l.date === today)
  ).length;

  return (
    <Link href="/habits" className="bg-white rounded-2xl border border-stone-100 p-4 hover:bg-stone-50 transition-colors active:scale-[0.97] block">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-stone-800">Habit Hari Ini</span>
        </div>
        <span className="text-xs text-stone-400">{done}/{total} selesai</span>
      </div>
      {total === 0 ? (
        <p className="text-xs text-stone-400">Belum ada habit — tambah sekarang</p>
      ) : (
        <>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex gap-2 mt-2.5 flex-wrap">
            {habits.slice(0, 6).map((h) => {
              const isDone = h.logs.some((l) => l.userId === userId && l.date === today);
              return (
                <div key={h.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                  isDone ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
                }`}>
                  <span>{h.emoji}</span>
                  <span className="font-medium truncate max-w-[60px]">{h.title}</span>
                  {isDone && <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Link>
  );
}

async function BucketSection() {
  const items     = await getBucketList();
  const total     = items.length;
  const completed = items.filter((i) => i.completed).length;

  return (
    <Link href="/bucket-list" className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 hover:bg-stone-50 transition-colors active:scale-[0.97]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Bucket List</span>
        <ListChecks className="w-4 h-4 text-amber-400" />
      </div>
      {total === 0 ? (
        <p className="text-xs text-stone-400">Belum ada</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-stone-800">
            {completed}<span className="text-base font-normal text-stone-400">/{total}</span>
          </p>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-stone-400">selesai</p>
        </>
      )}
    </Link>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function WidgetSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-100 p-4 animate-pulse ${className}`}>
      <div className="h-3 bg-stone-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-stone-100 rounded w-3/4 mb-2" />
      <div className="h-2 bg-stone-100 rounded w-full" />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Hanya fetch session + couple info di level page — cepat
  const [session, coupleInfo] = await Promise.all([
    getSession(),
    getCoupleInfo(),
  ]);

  if (!session.ok) return null;

  const name    = session.name.split(" ")[0];
  const partner = coupleInfo?.members.find((m) => m.id !== session.userId);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat pagi" :
    hour < 17 ? "Selamat siang" :
    hour < 20 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2">
        <p className="text-sm text-stone-400">{greeting},</p>
        <h1 className="text-2xl font-bold text-stone-800 mt-0.5">{name} 👋</h1>
        {partner && (
          <p className="text-xs text-stone-400 mt-1">
            Bersama <span className="font-medium text-stone-500">{partner.name.split(" ")[0]}</span>
          </p>
        )}
      </div>

      {/* Row 1 — Countdown + Mood (load parallel, non-blocking) */}
      <div className="grid grid-cols-2 gap-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <CountdownSection />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <MoodSection
            userId={session.userId}
            partnerId={partner?.id}
            partnerName={partner?.name.split(" ")[0]}
          />
        </Suspense>
      </div>

      {/* Row 2 — Habits */}
      <Suspense fallback={<WidgetSkeleton className="h-28" />}>
        <HabitSection userId={session.userId} />
      </Suspense>

      {/* Row 3 — Bucket list + Vault */}
      <div className="grid grid-cols-2 gap-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <BucketSection />
        </Suspense>
        <Link href="/vault" className="bg-white rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 hover:bg-stone-50 transition-colors active:scale-[0.97]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Vault</span>
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-stone-600 leading-relaxed mt-1">Data sensitif tersimpan aman</p>
          <p className="text-[11px] text-indigo-400 font-medium mt-auto">Buka vault →</p>
        </Link>
      </div>

      {/* Letters */}
      <Link href="/letters" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors">
        <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
          <BookHeart className="w-5 h-5 text-pink-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-stone-800">Surat & Catatan</p>
          <p className="text-xs text-stone-400 mt-0.5">Tulis pesan untuk pasanganmu</p>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
      </Link>

      {/* Invite banner */}
      {!partner && coupleInfo && (
        <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-100">
          <p className="font-semibold text-sm text-indigo-700">Undang pasanganmu</p>
          <p className="text-xs text-indigo-400 mt-1 mb-3">Bagikan kode invite agar pasanganmu bisa bergabung.</p>
          <div className="flex items-center bg-white rounded-xl px-4 py-2.5">
            <span className="font-mono font-bold text-lg tracking-widest text-indigo-600 flex-1">
              {coupleInfo.couple.inviteCode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}