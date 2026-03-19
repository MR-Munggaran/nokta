"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setupMasterPassword } from "@/actions/masterPassword";
import { createCouple, joinCouple } from "@/actions/couple";
import { Lock, Users, ArrowRight, Copy, Check, Eye, EyeOff } from "lucide-react";

type Step = "master-password" | "couple-choice" | "create" | "join" | "invite";

export default function OnboardingPage() {
  const [step, setStep]                     = useState<Step>("master-password");
  const [loading, setLoading]               = useState(false);
  const [inviteCode, setInviteCode]         = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [copied, setCopied]                 = useState(false);

  // Step 1: Setup master password
  const handleMasterPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd      = new FormData(e.currentTarget);
    const pass    = fd.get("masterPassword") as string;
    const confirm = fd.get("confirm") as string;

    if (pass !== confirm) return toast.error("Master password tidak cocok.");
    if (pass.length < 8)  return toast.error("Minimal 8 karakter.");

    setMasterPassword(pass);
    setStep("couple-choice");
  };

  // Step 2a: Create couple
  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await createCouple();
      if (!result.success) throw new Error(result.error);
      setInviteCode(result.inviteCode!);
      setStep("invite");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat couple.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: Join couple
  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd   = new FormData(e.currentTarget);
    const code = fd.get("inviteCode") as string;

    try {
      const result = await joinCouple(code);
      if (!result.success) throw new Error(result.error);
      // Setelah join, setup master password
      await setupMasterPassword(masterPassword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal bergabung.");
      setLoading(false);
    }
  };

  // Copy invite code
  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Continue after sharing invite code
  const handleContinue = async () => {
    setLoading(true);
    try {
      await setupMasterPassword(masterPassword);
    } catch {
      toast.error("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0E0E12] flex items-center justify-center p-4">
      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10 pointer-events-none blur-[120px]"
        style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm relative z-10">

        {/* ── STEP 1: Master Password ── */}
        {step === "master-password" && (
          <>
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Buat Master Password</h1>
              <p className="text-sm text-white/40 mt-2 leading-relaxed max-w-[260px] mx-auto">
                Password ini mengenkripsi semua data sensitifmu. Jangan sampai lupa — tidak ada recovery.
              </p>
            </div>

            <div
              className="rounded-3xl border border-white/[0.07] p-6"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
            >
              <form onSubmit={handleMasterPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      name="masterPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      required
                      minLength={8}
                      className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none border border-white/[0.08] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                    Konfirmasi
                  </label>
                  <input
                    name="confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi master password"
                    required
                    minLength={8}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none border border-white/[0.08] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                >
                  Lanjut <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── STEP 2: Couple Choice ── */}
        {step === "couple-choice" && (
          <>
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Hubungkan Pasangan</h1>
              <p className="text-sm text-white/40 mt-2">Buat ruang baru atau bergabung ke yang sudah ada.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-2xl border border-white/[0.07] p-5 text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="font-semibold text-white text-sm">Buat Ruang Baru</p>
                <p className="text-xs text-white/40 mt-1">Kamu yang pertama — undang pasanganmu dengan kode invite</p>
              </button>
              <button
                onClick={() => setStep("join")}
                className="w-full rounded-2xl border border-white/[0.07] p-5 text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="font-semibold text-white text-sm">Masukkan Kode Invite</p>
                <p className="text-xs text-white/40 mt-1">Pasanganmu sudah daftar dan punya kode</p>
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3a: Invite Code ── */}
        {step === "invite" && (
          <>
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Undang Pasangan</h1>
              <p className="text-sm text-white/40 mt-2">Bagikan kode ini ke pasanganmu.</p>
            </div>

            <div
              className="rounded-3xl border border-white/[0.07] p-6 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
            >
              <div
                className="rounded-2xl border border-white/[0.07] p-5 flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <span className="text-3xl font-bold tracking-[0.2em] text-white font-mono">
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: copied ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)" }}
                >
                  {copied
                    ? <Check className="w-4 h-4 text-indigo-400" />
                    : <Copy  className="w-4 h-4 text-white/40" />
                  }
                </button>
              </div>

              <p className="text-xs text-white/30 text-center leading-relaxed">
                Kamu bisa lanjut sekarang dan pasanganmu bisa join kapan saja dengan kode ini.
              </p>

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <> Lanjut ke Dashboard <ArrowRight className="w-4 h-4" /> </>
                }
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3b: Join ── */}
        {step === "join" && (
          <>
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Masukkan Kode</h1>
              <p className="text-sm text-white/40 mt-2">Minta kode invite dari pasanganmu.</p>
            </div>

            <div
              className="rounded-3xl border border-white/[0.07] p-6"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
            >
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                    Kode Invite
                  </label>
                  <input
                    name="inviteCode"
                    type="text"
                    placeholder="A3F9B2"
                    required
                    maxLength={6}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none border border-white/[0.08] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 uppercase tracking-widest font-mono text-center text-lg"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("couple-choice")}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white/40 border border-white/[0.08] hover:border-white/20 transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : "Bergabung"
                    }
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
}