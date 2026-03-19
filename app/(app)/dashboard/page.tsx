import { getSession } from "@/actions/auth";
import { getCoupleInfo } from "@/actions/couple";
import { Shield, ListChecks, CalendarHeart, Activity, BookHeart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [session, coupleInfo] = await Promise.all([
    getSession(),
    getCoupleInfo(),
  ]);

  const name    = session.ok ? session.name.split(" ")[0] : "";
  const partner = coupleInfo?.members.find(
    (m) => session.ok && m.id !== session.userId
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat pagi" :
    hour < 17 ? "Selamat siang" :
    hour < 20 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-sm text-stone-400">{greeting},</p>
        <h1 className="text-2xl font-bold text-stone-800 mt-0.5">{name} 👋</h1>
        {partner && (
          <p className="text-xs text-stone-400 mt-1">
            Terhubung dengan <span className="font-medium text-stone-500">{partner.name.split(" ")[0]}</span>
          </p>
        )}
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          href="/vault"
          icon={Shield}
          label="Vault"
          desc="Simpan data sensitif"
          color="bg-indigo-50 text-indigo-500"
        />
        <QuickCard
          href="/dates"
          icon={CalendarHeart}
          label="Tanggal Spesial"
          desc="Countdown hari penting"
          color="bg-rose-50 text-rose-500"
        />
        <QuickCard
          href="/habits"
          icon={Activity}
          label="Habit & Mood"
          desc="Aktivitas harian"
          color="bg-emerald-50 text-emerald-500"
        />
        <QuickCard
          href="/bucket-list"
          icon={ListChecks}
          label="Bucket List"
          desc="Mimpi bersama"
          color="bg-amber-50 text-amber-500"
        />
      </div>

      {/* Letters shortcut */}
      <Link
        href="/letters"
        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors"
      >
        <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
          <BookHeart className="w-5 h-5 text-pink-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-stone-800">Surat & Catatan</p>
          <p className="text-xs text-stone-400 mt-0.5">Tulis pesan untuk pasanganmu</p>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
      </Link>

      {/* Invite partner banner — tampil kalau partner belum join */}
      {!partner && coupleInfo && (
        <div className="rounded-2xl p-4 bg-indigo-50 border border-indigo-100">
          <p className="font-semibold text-sm text-indigo-700">Undang pasanganmu</p>
          <p className="text-xs text-indigo-400 mt-1 mb-3">
            Bagikan kode invite agar pasanganmu bisa bergabung.
          </p>
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
            <span className="font-mono font-bold text-lg tracking-widest text-indigo-600 flex-1">
              {coupleInfo.couple.inviteCode}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUICK CARD ───────────────────────────────────────────────────────────────

function QuickCard({
  href, icon: Icon, label, desc, color,
}: {
  href:  string;
  icon:  typeof Shield;
  label: string;
  desc:  string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors active:scale-[0.97]"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm text-stone-800">{label}</p>
        <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}