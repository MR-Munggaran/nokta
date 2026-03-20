import Link from "next/link";
import { getSession } from "@/actions/auth";
import { logout } from "@/actions/auth";
import { lock } from "@/actions/masterPassword";
import { ListChecks, BookHeart, Settings, LogOut, ChevronRight, Lock } from "lucide-react";

const MORE_ITEMS = [
  { href: "/bucket-list", icon: ListChecks, label: "Bucket List",     desc: "Hal-hal yang ingin kalian lakukan" },
  { href: "/letters",     icon: BookHeart,  label: "Surat & Catatan", desc: "Pesan untuk pasanganmu" },
  { href: "/settings",    icon: Settings,   label: "Pengaturan",      desc: "Akun dan preferensi" },
];

export default async function MorePage() {
  const session = await getSession();
  const name    = session.ok ? session.name : "";

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center text-lg font-bold text-stone-500">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-stone-800">{name}</p>
          <p className="text-xs text-stone-400">Nokta Member</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {MORE_ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-stone-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-stone-800">{label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Security Actions */}
      <div className="space-y-2">
        {/* Manual Lock */}
        <form action={lock}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-amber-100 hover:bg-amber-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-stone-800">Kunci Vault</p>
              <p className="text-xs text-stone-400 mt-0.5">Enkripsi aktif kembali</p>
            </div>
          </button>
        </form>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-100 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-red-400">Keluar</p>
              <p className="text-xs text-stone-400 mt-0.5">Sesi akan berakhir</p>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}