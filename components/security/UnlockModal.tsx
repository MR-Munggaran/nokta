"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockWithMasterPassword } from "@/actions/masterPassword";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";

export function UnlockModal() {
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts]         = useState(0);

  const MAX_ATTEMPTS = 5;
  const isBlocked    = attempts >= MAX_ATTEMPTS;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBlocked) return;

    setLoading(true);
    const fd       = new FormData(e.currentTarget);
    const password = fd.get("masterPassword") as string;

    const result = await unlockWithMasterPassword(password);
    setLoading(false);

    if (!result.success) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        toast.error("Terlalu banyak percobaan. Silakan login ulang.");
      } else {
        toast.error(`Master password salah. Sisa percobaan: ${MAX_ATTEMPTS - newAttempts}`);
      }
      return;
    }

    toast.success("Vault terbuka!");
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-stone-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-stone-800 text-center mb-1">
          Vault Terkunci
        </h2>
        <p className="text-sm text-stone-400 text-center mb-6">
          Masukkan master password untuk melanjutkan
        </p>

        {isBlocked ? (
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-red-500">
              Terlalu banyak percobaan gagal.
            </p>
            <p className="text-xs text-red-400 mt-1">
              Silakan logout dan login kembali.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                {MAX_ATTEMPTS - attempts} percobaan tersisa
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
          </form>
        )}
      </div>
    </div>
  );
}