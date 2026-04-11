"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toggleBucketItem, deleteBucketItem } from "@/actions/bucketList";
import { getSession } from "@/actions/auth";
import { getCoupleInfo } from "@/actions/couple";
import { toast } from "sonner";
import { Check, Pencil, Trash2, ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import type { BucketItem } from "@/actions/bucketList";

const CATEGORY_EMOJI: Record<string, string> = {
  travel:    "✈️",
  food:      "🍜",
  adventure: "🏔️",
  romance:   "💕",
  creative:  "🎨",
  general:   "⭐",
};

const CATEGORY_LABEL: Record<string, string> = {
  travel:    "Travel",
  food:      "Kuliner",
  adventure: "Petualangan",
  romance:   "Romantis",
  creative:  "Kreatif",
  general:   "Lainnya",
};

function formatDate(date: Date | string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BucketDetail({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<BucketItem | null>(null);
  const [coupleInfo, setCoupleInfo] = useState<Awaited<ReturnType<typeof getCoupleInfo>>>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    async function load() {
      const [sessionResult, itemResult, coupleResult] = await Promise.all([
        getSession(),
        import("@/actions/bucketList").then(m => m.getBucketItemById(id)),
        getCoupleInfo(),
      ]);
      
      if (!sessionResult.ok || !itemResult) {
        router.replace("/bucket-list");
        return;
      }
      
      setItem(itemResult);
      setCoupleInfo(coupleResult);
      setLoading(false);
    }
    load();
  });

  if (loading || !item) {
    return <div className="text-sm text-stone-400">Memuat...</div>;
  }

  const emoji = CATEGORY_EMOJI[item.category] ?? "⭐";
  const categoryLabel = CATEGORY_LABEL[item.category] ?? "Lainnya";
  
  const createdByName = coupleInfo?.members.find(m => m.id === item.createdBy)?.name.split(" ")[0] ?? "Partner";
  const completedByName = item.completedBy 
    ? coupleInfo?.members.find(m => m.id === item.completedBy)?.name.split(" ")[0]
    : null;

  async function handleToggle() {
    setBusy(true);
    const result = await toggleBucketItem(id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success(item.completed ? "Dibatalkan" : "Selesai! 🎉");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Hapus "${item.title}"?`)) return;
    setBusy(true);
    const result = await deleteBucketItem(id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Item dihapus");
    router.push("/bucket-list");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link
        href="/bucket-list"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      {item.image && (
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
          {item.completed && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              Selesai
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            {categoryLabel}
          </span>
        </div>
        <h1 className={`text-2xl font-bold text-stone-800 ${item.completed ? "line-through opacity-60" : ""}`}>
          {item.title}
        </h1>
        {item.description && (
          <p className="text-stone-500 mt-2 leading-relaxed">{item.description}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <User className="w-4 h-4" />
          <span>Ditambahkan oleh <span className="font-medium text-stone-700">{createdByName}</span></span>
        </div>
        
        {item.createdAt && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(item.createdAt)}</span>
          </div>
        )}

        {item.completed && completedByName && item.completedAt && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl">
            <Check className="w-4 h-4" />
            <span>Diselesaikan oleh <span className="font-medium">{completedByName}</span> pada {formatDate(item.completedAt)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
            item.completed
              ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {busy ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              {item.completed ? "Batalkan Selesai" : "Tandai Selesai"}
            </>
          )}
        </button>

        <Link
          href={`/bucket-list/${id}/edit`}
          className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-amber-200 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </Link>

        <button
          onClick={handleDelete}
          disabled={busy}
          className="w-12 h-12 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
