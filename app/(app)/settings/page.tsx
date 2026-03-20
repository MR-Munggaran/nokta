"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeMasterPassword } from "@/actions/masterPassword";
import { logout } from "@/actions/auth";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, LogOut, Shield, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [showForm, setShowForm]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showOld, setShowOld]         = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const handleChangeMasterPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd         = new FormData(e.currentTarget);
    const current    = fd.get("current") as string;
    const newPass    = fd.get("new") as string;
    const confirm    = fd.get("confirm") as string;

    if (newPass !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    const result = await changeMasterPassword(current, newPass);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Master password berhasil diubah!");
    setShowForm(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Pengaturan</h1>
        <p className="text-sm text-stone-400 mt-1">Kelola akun dan keamananmu</p>
      </div>

      {/* Security section */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Keamanan</p>

        {/* Change master password */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="w-full flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-stone-800">Ganti Master Password</p>
              <p className="text-xs text-stone-400 mt-0.5">Password untuk dekripsi vault</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-stone-300 transition-transform ${showForm ? "rotate-90" : ""}`} />
          </button>

          {showForm && (
            <form onSubmit={handleChangeMasterPassword} className="px-4 pb-4 space-y-3 border-t border-stone-50 pt-3">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Master Password Lama
                </label>
                <div className="relative">
                  <input
                    name="current"
                    type={showOld ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full bg-stone-50 rounded-xl px-4 py-3 pr-11 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
                  />
                  <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Master Password Baru
                </label>
                <div className="relative">
                  <input
                    name="new"
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 8 karakter"
                    required
                    minLength={8}
                    className="w-full bg-stone-50 rounded-xl px-4 py-3 pr-11 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Konfirmasi Password Baru
                </label>
                <input
                  name="confirm"
                  type={showNew ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  required
                  minLength={8}
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
                />
              </div>

              {/* Warning */}
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 leading-relaxed">
                  ⚠️ Setelah ganti master password, semua vault item perlu di-decrypt ulang. Pastikan kamu ingat password baru.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-xl text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-indigo-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : "Simpan"
                  }
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security info */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-stone-800">Enkripsi AES-256-GCM</p>
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
              Semua data sensitif di vault dienkripsi dengan standar industri. Master password tidak pernah disimpan di server.
            </p>
          </div>
        </div>
      </div>

      {/* Account section */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Akun</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-100 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-red-400">Keluar</p>
              <p className="text-xs text-stone-400 mt-0.5">Sesi akan berakhir</p>
            </div>
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="text-center py-4 space-y-1">
        <p className="text-sm font-bold text-stone-400">● Nokta</p>
        <p className="text-xs text-stone-300">v1.0.0 · Satu titik untuk semua yang penting.</p>
      </div>
    </div>
  );
}