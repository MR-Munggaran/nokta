"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // Tambahkan ini
import { deleteMoment } from "@/actions/moments";
import { toast } from "sonner";
import { Heart, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { MomentWithRelations } from "@/actions/moments";

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MomentCard({ moment }: { moment: MomentWithRelations }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // Untuk arah animasi

  const allPhotos = [
    moment.imageUrl,
    ...moment.images
      .sort((a, b) => a.order - b.order)
      .map((img) => img.imageUrl),
  ];

  const hasMultiple = allPhotos.length > 1;

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  // Variasi animasi untuk gambar
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  async function handleDelete() {
    if (!confirm("Hapus momen ini?")) return;
    setBusy(true);
    const result = await deleteMoment(moment.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Momen dihapus");
    router.refresh();
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl overflow-hidden bg-white border border-stone-100 flex flex-col group"
    >
      {/* Image carousel */}
      <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={allPhotos[index]}
              alt={moment.caption ?? "Momen"}
              fill
              sizes="(max-width: 480px) 50vw, 33vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {hasMultiple && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prev}
                className="w-8 h-8 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={next}
                className="w-8 h-8 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/10 backdrop-blur-sm rounded-full">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Counter */}
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-black/20 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
              {index + 1} / {allPhotos.length}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {moment.caption && (
          <p className="text-sm font-semibold text-stone-700 leading-snug line-clamp-2">
            {moment.caption}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-stone-500">
              {moment.uploader?.name?.split(" ")[0] ?? "—"}
            </span>
            <span className="text-[10px] text-stone-400">
              {formatDate(moment.date ?? moment.createdAt)}
            </span>
          </div>
          <motion.div whileTap={{ scale: 1.3 }}>
             <Heart className="w-4 h-4 text-rose-400 fill-rose-400 flex-shrink-0 cursor-pointer" />
          </motion.div>
        </div>

        <button
          onClick={handleDelete}
          disabled={busy}
          className="mt-auto pt-2 w-full flex items-center justify-center gap-2 text-[11px] font-bold text-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          {busy ? "Menghapus..." : "Hapus Momen"}
        </button>
      </div>
    </motion.div>
  );
}