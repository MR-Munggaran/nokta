"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/actions/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login({
        email:    fd.get("email") as string,
        password: fd.get("password") as string,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login gagal.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0E0E12] flex items-center justify-center p-4">
      {/* Background grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }}
      />

      {/* Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 rounded-full opacity-10 pointer-events-none blur-[120px]"
        style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nokta</h1>
          <p className="text-sm text-white/40 mt-1.5">Satu titik untuk semua yang penting.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/[0.07] p-7"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Masuk</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="kamu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all border border-white/8 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all border border-white/8 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98] mt-2"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : "Masuk"}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-white/30 mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}