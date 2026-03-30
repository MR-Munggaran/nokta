"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockWithMasterPassword, resetMasterPassword } from "@/actions/masterPassword";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, AlertTriangle, Trash2 } from "lucide-react";

const MAX_ATTEMPTS = 5;

type Screen = "unlock" | "reset-confirm";

export function UnlockModal() {
  const router = useRouter();

  const [screen, setScreen]             = useState<Screen>("unlock");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts]         = useState(0);

  const isBlocked = attempts >= MAX_ATTEMPTS;

  // ─── UNLOCK ───────────────────────────────────────────────────────────────

  const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBlocked) return;

    setLoading(true);
    const fd       = new FormData(e.currentTarget);
    const password = fd.get("masterPassword") as string;
    const result   = await unlockWithMasterPassword(password);
    setLoading(false);

    if (!result.success) {
      const next = attempts + 1;
      setAttempts(next);

      if (next >= MAX_ATTEMPTS) {
        // Langsung pindah ke screen reset
        setScreen("reset-confirm");
      } else {
        toast.error(result.error ?? "Master password salah.");
      }
      return;
    }

    toast.success("Vault terbuka!");
    router.refresh();
  };

  // ─── RESET ────────────────────────────────────────────────────────────────

  const handleReset = async () => {
    setLoading(true);
    const result = await resetMasterPassword();
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Gagal mereset vault.");
      return;
    }

    toast.success("Vault direset. Silakan buat master password baru.");
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* ── UNLOCK SCREEN ── */}
        {screen === "unlock" && (
          <div className="p-6">
            <div className="flex justify-center mb-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                isBlocked ? "bg-red-50" : "bg-stone-100"
              }`}>
                <Lock className={`w-7 h-7 ${isBlocked ? "text-red-400" : "text-stone-500"}`} />
              </div>
            </div>

            <h2 className="text-xl font-bold text-stone-800 text-center mb-1">
              Vault Terkunci
            </h2>
            <p className="text-sm text-stone-400 text-center mb-6">
              Masukkan master password untuk melanjutkan
            </p>

            {isBlocked ? (
              // Seharusnya tidak pernah tampil karena langsung redirect ke reset-confirm,
              // tapi sebagai fallback
              <div className="bg-red-50 rounded-2xl p-4 text-center space-y-3">
                <p className="text-sm font-medium text-red-500">
                  Terlalu banyak percobaan gagal.
                </p>
                <button
                  onClick={() => setScreen("reset-confirm")}
                  className="text-sm font-semibold text-red-500 underline underline-offset-2"
                >
                  Reset vault
                </button>
              </div>
            ) : (
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="relative">
                  <input
                    name="masterPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Master password"
                    required
                    autoFocus
                    className="w-full bg-stone-50 rounded-2xl px-4 py-3.5 pr-11 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {attempts > 0 && (
                  <p className="text-xs text-amber-500 text-center">
                    {MAX_ATTEMPTS - attempts} percobaan tersisa sebelum vault direset
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-stone-900 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : "Buka Vault"
                  }
                </button>

                <button
                  type="button"
                  onClick={() => setScreen("reset-confirm")}
                  className="w-full text-xs text-stone-400 hover:text-stone-600 transition-colors py-1"
                >
                  Lupa master password?
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── RESET CONFIRM SCREEN ── */}
        {screen === "reset-confirm" && (
          <div className="p-6">
            {/* Warning header */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-stone-800 text-center mb-1">
              Reset Master Password
            </h2>
            <p className="text-sm text-stone-400 text-center mb-5">
              Kamu tidak bisa membuka vault dengan password yang kamu ingat
            </p>

            {/* Warning box */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 space-y-1.5">
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-xs font-semibold text-red-500">Semua data vault akan dihapus permanen</p>
              </div>
              <p className="text-xs text-red-400 pl-5 leading-relaxed">
                Password, dokumen, dan catatan yang tersimpan tidak bisa dipulihkan setelah reset.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : "Ya, hapus dan reset"
                }
              </button>

              <button
                type="button"
                onClick={() => { setScreen("unlock"); setAttempts(0); }}
                disabled={loading}
                className="w-full py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors hover:bg-stone-200"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}