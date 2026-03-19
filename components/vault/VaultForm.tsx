"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVaultItem } from "@/actions/vault";
import { toast } from "sonner";
import { Plus, X, KeyRound, FileText, StickyNote, Eye, EyeOff } from "lucide-react";
import type { CreateVaultItemInput } from "@/lib/validations";

type VaultType = "credential" | "document" | "note";

const TYPE_OPTIONS: { key: VaultType; label: string; icon: typeof KeyRound; desc: string }[] = [
  { key: "credential", label: "Akun",    icon: KeyRound,   desc: "Username & password" },
  { key: "document",   label: "Dokumen", icon: FileText,   desc: "KTP, rekening, dll" },
  { key: "note",       label: "Catatan", icon: StickyNote, desc: "Catatan pribadi" },
];

export function VaultForm() {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [type, setType]           = useState<VaultType | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => { setOpen(false); setType(null); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!type) return;
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    let input: CreateVaultItemInput;

    if (type === "credential") {
      input = {
        type,
        name:   fd.get("name") as string,
        shared: fd.get("shared") === "on",
        data: {
          username: fd.get("username") as string,
          password: fd.get("password") as string,
          url:      (fd.get("url") as string) || undefined,
          notes:    (fd.get("notes") as string) || undefined,
        },
      };
    } else if (type === "document") {
      input = {
        type,
        name:   fd.get("name") as string,
        shared: fd.get("shared") === "on",
        data: {
          number: fd.get("number") as string,
          issuer: fd.get("issuer") as string,
          expiry: (fd.get("expiry") as string) || undefined,
          notes:  (fd.get("notes") as string) || undefined,
        },
      };
    } else {
      input = {
        type,
        name:   fd.get("name") as string,
        shared: fd.get("shared") === "on",
        data: { content: fd.get("content") as string },
      };
    }

    try {
      const result = await createVaultItem(input);
      if (!result.success) throw new Error(result.error);
      toast.success("Item berhasil disimpan!");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(var(--bottom-nav-h,72px)+20px)] right-5 z-40 w-14 h-14 rounded-full bg-stone-800 text-white flex items-center justify-center shadow-lg hover:bg-stone-700 active:scale-90 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-[88px] sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={handleClose} />
      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">
            {type ? `Tambah ${TYPE_OPTIONS.find((t) => t.key === type)?.label}` : "Pilih Tipe"}
          </h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Type Selection */}
          {!type ? (
            <div className="p-5 space-y-2">
              {TYPE_OPTIONS.map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{label}</p>
                    <p className="text-xs text-stone-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Form */
            <form id="vault-form" onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <Field label="Nama / Label" name="name" placeholder="Contoh: Gmail, KTP, Wifi Rumah" required />

              {/* Credential Fields */}
              {type === "credential" && (
                <>
                  <Field label="Username / Email" name="username" placeholder="contoh@email.com" required />
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="w-full bg-stone-50 rounded-xl px-4 py-3 pr-10 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Field label="URL (opsional)" name="url" placeholder="https://gmail.com" type="url" />
                  <Field label="Catatan (opsional)" name="notes" placeholder="Info tambahan..." textarea />
                </>
              )}

              {/* Document Fields */}
              {type === "document" && (
                <>
                  <Field label="Nomor" name="number" placeholder="1234 5678 9012" required />
                  <Field label="Penerbit / Instansi" name="issuer" placeholder="Dukcapil, BCA, dll" required />
                  <Field label="Berlaku sampai (opsional)" name="expiry" placeholder="12/2029" />
                  <Field label="Catatan (opsional)" name="notes" placeholder="Info tambahan..." textarea />
                </>
              )}

              {/* Note Fields */}
              {type === "note" && (
                <Field label="Isi catatan" name="content" placeholder="Tulis catatan rahasia kamu..." textarea required />
              )}

              {/* Shared toggle */}
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input name="shared" type="checkbox" className="w-4 h-4 rounded accent-stone-800" />
                <span className="text-sm text-stone-600">Bagikan ke pasangan</span>
              </label>
            </form>
          )}
        </div>

        {/* Footer */}
        {type && (
          <div className="p-5 border-t border-stone-50">
            <div className="flex gap-3">
              <button type="button" onClick={() => setType(null)} className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold">
                Kembali
              </button>
              <button
                type="submit"
                form="vault-form"
                disabled={loading}
                className="flex-[2] py-3.5 bg-stone-800 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FIELD HELPER ─────────────────────────────────────────────────────────────

function Field({ label, name, placeholder, required, type = "text", textarea }: {
  label:       string;
  name:        string;
  placeholder: string;
  required?:   boolean;
  type?:       string;
  textarea?:   boolean;
}) {
  const cls = "w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300";
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
      {textarea
        ? <textarea name={name} placeholder={placeholder} required={required} rows={3} className={`${cls} resize-none`} />
        : <input name={name} type={type} placeholder={placeholder} required={required} className={cls} />
      }
    </div>
  );
}