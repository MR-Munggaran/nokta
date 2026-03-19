"use client";

import { useState } from "react";
import { KeyRound, FileText, StickyNote } from "lucide-react";
import { VaultCard } from "./VaultCard";
import type { DecryptedVaultItem } from "@/actions/vault";

const TABS = [
  { key: "all",        label: "Semua",     icon: null },
  { key: "credential", label: "Akun",      icon: KeyRound },
  { key: "document",   label: "Dokumen",   icon: FileText },
  { key: "note",       label: "Catatan",   icon: StickyNote },
] as const;

type Tab = typeof TABS[number]["key"];

export function VaultList({ items }: { items: DecryptedVaultItem[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const matchTab    = activeTab === "all" || item.type === activeTab;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Cari vault..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-stone-50 rounded-2xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === key
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-stone-300 text-sm">
          {search ? "Tidak ada hasil" : "Belum ada item"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <VaultCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}