import { getVaultItems } from "@/actions/vault";
import { VaultList } from "@/components/vault/VaultList";
import { VaultForm } from "@/components/vault/VaultForm";
import { Lock } from "lucide-react";

export default async function VaultPage() {
  const result = await getVaultItems();

  // Vault terkunci — key tidak ada di session
  if (!result.success && result.error.includes("terkunci")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
          <Lock className="w-9 h-9 text-stone-400" />
        </div>
        <h2 className="font-semibold text-xl text-stone-700 mb-1">Vault Terkunci</h2>
        <p className="text-sm text-stone-400 max-w-[220px] leading-relaxed">
          Masukkan master password untuk mengakses vault kamu.
        </p>
        {/* UnlockForm akan ditambah di Sprint 6 */}
      </div>
    );
  }

  const items = result.success ? result.data : [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Vault</h1>
        <p className="text-sm text-stone-400 mt-1">{items.length} item tersimpan</p>
      </div>

      <VaultList items={items} />
      <VaultForm />
    </>
  );
}