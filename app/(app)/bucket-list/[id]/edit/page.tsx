"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBucketItemById } from "@/actions/bucketList";
import { getSession } from "@/actions/auth";
import { updateBucketItem } from "@/actions/bucketList";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, X, Check } from "lucide-react";
import { handleImageUpload } from "@/lib/upload-client";
import type { BucketItem } from "@/actions/bucketList";

const CATEGORIES = [
  { key: "travel",    label: "Travel",      emoji: "✈️" },
  { key: "food",      label: "Kuliner",     emoji: "🍜" },
  { key: "adventure", label: "Petualangan", emoji: "🏔️" },
  { key: "romance",   label: "Romantis",    emoji: "💕" },
  { key: "creative",  label: "Kreatif",     emoji: "🎨" },
  { key: "general",   label: "Lainnya",     emoji: "⭐" },
];

export default function BucketEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<BucketItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      const resolvedParams = await params;
      const id = Number(resolvedParams.id);
      if (isNaN(id)) {
        router.replace("/bucket-list");
        return;
      }

      const [sessionResult, itemResult] = await Promise.all([
        getSession(),
        getBucketItemById(id),
      ]);

      if (!sessionResult.ok || !itemResult) {
        router.replace("/bucket-list");
        return;
      }

      setItem(itemResult);
      setTitle(itemResult.title);
      setDescription(itemResult.description ?? "");
      setCategory(itemResult.category);
      setLoading(false);
    }
    load();
  }, [params, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;

    setBusy(true);
    let imageUrl: string | undefined;

    try {
      if (newImage && newImage.size > 0) {
        imageUrl = await handleImageUpload(newImage);
      }

      const payload: Partial<Pick<BucketItem, "image" | "title" | "description" | "category">> = {
        title,
        description: description || null,
        category,
      };

      if (imageUrl) {
        payload.image = imageUrl;
      }

      const result = await updateBucketItem(item.id, payload);

      if (!result.success) throw new Error(result.error);

      toast.success("Item berhasil diperbarui! ✨");
      router.push(`/bucket-list/${item.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <div className="text-sm text-stone-400">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-4">
      <Link
        href={`/bucket-list/${item?.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">Edit Bucket List</h2>
          <Link
            href={`/bucket-list/${item?.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200"
          >
            <X className="w-4 h-4 text-stone-500" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Apa yang ingin kalian lakukan?
            </label>
            <input
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Deskripsi (opsional)
            </label>
            <textarea
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Ubah Gambar (opsional)
            </label>
            {item?.image && (
              <p className="text-[10px] text-amber-500 mb-1">
                *Gambar sudah ada. Biarkan kosong jika tidak ingin mengubahnya.
              </p>
            )}
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
              className="w-full bg-stone-50 rounded-xl px-4 py-2.5 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-colors cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Kategori
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    category === key
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Link
              href={`/bucket-list/${item?.id}`}
              className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="flex-[2] py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {busy
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : "Simpan Perubahan"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
