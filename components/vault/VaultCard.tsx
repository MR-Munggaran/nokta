"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteVaultItem, toggleVaultItemShared } from "@/actions/vault";
import { toast } from "sonner";
import {
  KeyRound, FileText, StickyNote, Eye, EyeOff,
  Copy, Check, Trash2, Users, Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import type { DecryptedVaultItem } from "@/actions/vault";
import type { CredentialData, DocumentData, NoteData } from "@/lib/validations";

const TYPE_CONFIG = {
  credential: { icon: KeyRound,   label: "Akun",    color: "bg-blue-50 text-blue-500" },
  document:   { icon: FileText,   label: "Dokumen", color: "bg-amber-50 text-amber-500" },
  note:       { icon: StickyNote, label: "Catatan", color: "bg-green-50 text-green-500" },
};

export function VaultCard({ item }: { item: DecryptedVaultItem }) {
  const router = useRouter();
  const [expanded, setExpanded]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied]             = useState<string | null>(null);
  const [busy, setBusy]                 = useState(false);

  const config = TYPE_CONFIG[item.type];
  const Icon   = config.icon;
  const isPartnerItem = !item.isOwn;

  async function copyToClipboard(value: string, field: string) {
    await navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Hapus "${item.name}"?`)) return;
    setBusy(true);
    const result = await deleteVaultItem(item.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Item dihapus");
    router.refresh();
  }

  async function handleToggleShared() {
    setBusy(true);
    const result = await toggleVaultItemShared(item.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success(result.data.shared ? "Dibagikan ke pasangan" : "Disembunyikan dari pasangan");
    router.refresh();
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      isPartnerItem ? "border-indigo-100" : "border-stone-100"
    }`}>
      {/* Partner badge */}
      {isPartnerItem && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 border-b border-indigo-100">
          <Users className="w-3 h-3 text-indigo-400" />
          <span className="text-[11px] font-medium text-indigo-400">
            Dari {item.owner.name.split(" ")[0]}
          </span>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-stone-800 truncate">{item.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-stone-400">{config.label}</span>
            {item.isOwn && item.shared && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-indigo-400 font-medium">
                <Users className="w-3 h-3" /> Dibagikan
              </span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp   className="w-4 h-4 text-stone-300 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-stone-300 flex-shrink-0" />
        }
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-50 pt-3">

          {/* Credential */}
          {item.type === "credential" && (() => {
            const d = item.data as CredentialData;
            return (
              <div className="space-y-2">
                <FieldRow label="Username" value={d.username} fieldKey="username" copied={copied} onCopy={copyToClipboard} />
                <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">Password</p>
                    <p className="text-sm text-stone-700 font-mono truncate">
                      {showPassword ? d.password : "••••••••"}
                    </p>
                  </div>
                  <button onClick={() => setShowPassword((v) => !v)} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyToClipboard(d.password, "password")} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
                    {copied === "password" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {d.url   && <FieldRow label="URL"     value={d.url}   fieldKey="url"   copied={copied} onCopy={copyToClipboard} />}
                {d.notes && <p className="text-xs text-stone-400 px-1">{d.notes}</p>}
              </div>
            );
          })()}

          {/* Document */}
          {item.type === "document" && (() => {
            const d = item.data as DocumentData;
            return (
              <div className="space-y-2">
                <FieldRow label="Nomor"    value={d.number} fieldKey="number" copied={copied} onCopy={copyToClipboard} />
                <FieldRow label="Penerbit" value={d.issuer} fieldKey="issuer" copied={copied} onCopy={copyToClipboard} />
                {d.expiry && (
                  <div className="bg-stone-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">Berlaku sampai</p>
                    <p className="text-sm text-stone-700">{d.expiry}</p>
                  </div>
                )}
                {d.notes && <p className="text-xs text-stone-400 px-1">{d.notes}</p>}
              </div>
            );
          })()}

          {/* Note */}
          {item.type === "note" && (
            <p className="text-sm text-stone-600 whitespace-pre-wrap bg-stone-50 rounded-xl px-3 py-2.5">
              {(item.data as NoteData).content}
            </p>
          )}

          {/* Actions — hanya untuk item milik sendiri */}
          {item.isOwn && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleToggleShared}
                disabled={busy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${
                  item.shared
                    ? "bg-indigo-50 text-indigo-500 hover:bg-indigo-100"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                {item.shared
                  ? <><Users className="w-3.5 h-3.5" /> Dibagikan</>
                  : <><Lock  className="w-3.5 h-3.5" /> Privat</>
                }
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          )}

          {isPartnerItem && (
            <p className="text-[11px] text-stone-300 text-center pt-1">
              Item ini hanya bisa dilihat
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FIELD ROW ────────────────────────────────────────────────────────────────

function FieldRow({
  label, value, fieldKey, copied, onCopy,
}: {
  label:    string;
  value:    string;
  fieldKey: string;
  copied:   string | null;
  onCopy:   (value: string, field: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-stone-700 truncate">{value}</p>
      </div>
      <button onClick={() => onCopy(value, fieldKey)} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
        {copied === fieldKey
          ? <Check className="w-4 h-4 text-green-500" />
          : <Copy  className="w-4 h-4" />
        }
      </button>
    </div>
  );
}