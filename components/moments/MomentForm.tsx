"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createMoment } from "@/actions/moments";
import { uploadToCloudinary, UploadError } from "@/lib/uploadToCloudinary";
import { toast } from "sonner";
import { Camera, Upload, X, Calendar, Heart, Plus } from "lucide-react";

interface Props {
  desktopTrigger?: boolean;
}

export function MomentForm({ desktopTrigger = false }: Props) {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const newFiles = [...files, ...selected].slice(0, 10);
    setFiles(newFiles);
    newFiles.forEach((file, i) => {
      if (previews[i]) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((prev) => {
          const next = [...prev];
          next[i] = reader.result as string;
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setOpen(false);
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return toast.error("Pilih minimal 1 foto dulu ya!");
    setLoading(true);
    try {
      const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file, "moments"))
      );
      const [coverUrl, ...extraUrls] = urls;
      const result = await createMoment({
        imageUrl:  coverUrl,
        imageUrls: extraUrls,
        caption:   caption || null,
        date:      new Date(date),
      });
      if (!result.success) throw new Error(result.error);
      toast.success("Momen berhasil disimpan! 💕");
      handleClose();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof UploadError ? err.message :
        err instanceof Error       ? err.message :
        "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Desktop trigger — tombol di header
  if (desktopTrigger) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Camera className="w-4 h-4" />
          Tambah Momen
        </button>
        {open && (
          <MomentFormModal
            previews={previews}
            files={files}
            caption={caption}
            date={date}
            loading={loading}
            fileInputRef={fileInputRef}
            onClose={handleClose}
            onSubmit={handleSubmit}
            onFiles={handleFiles}
            onRemove={removeFile}
            onCaption={setCaption}
            onDate={setDate}
          />
        )}
      </>
    );
  }

  // Mobile FAB
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-[calc(72px+20px)] right-5 z-40 w-14 h-14 rounded-full bg-rose-400 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-rose-500"
      >
        <Camera className="w-6 h-6" />
      </button>
      {open && (
        <MomentFormModal
          previews={previews}
          files={files}
          caption={caption}
          date={date}
          loading={loading}
          fileInputRef={fileInputRef}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onFiles={handleFiles}
          onRemove={removeFile}
          onCaption={setCaption}
          onDate={setDate}
        />
      )}
    </>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function MomentFormModal({
  previews, files, caption, date, loading, fileInputRef,
  onClose, onSubmit, onFiles, onRemove, onCaption, onDate,
}: {
  previews:     string[];
  files:        File[];
  caption:      string;
  date:         string;
  loading:      boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose:  () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFiles:  (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  onCaption:(v: string) => void;
  onDate:   (v: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-end justify-center md:items-center md:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* Handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h3 className="font-bold text-stone-800">Momen Baru</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">

          {/* Mobile header */}
          <div className="md:hidden flex items-center gap-2 py-4">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h3 className="font-bold text-lg text-stone-800">Momen Baru</h3>
          </div>

          <form id="moment-form" onSubmit={onSubmit} className="space-y-5 md:pt-4">

            {/* Photo grid */}
            <div>
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Foto ({files.length}/10)
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-white/90 text-rose-400 px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {files.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1 text-stone-400 hover:bg-stone-100 transition-colors active:scale-95"
                  >
                    {files.length === 0 ? (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Tambah foto</span>
                      </>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
                className="hidden"
              />
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => onCaption(e.target.value)}
                rows={3}
                placeholder="Ceritakan momen ini... 💕"
                className="w-full bg-stone-50 rounded-2xl px-4 py-3 text-sm text-stone-700 border border-transparent outline-none resize-none placeholder-stone-300 focus:bg-white focus:ring-2 focus:ring-rose-100 focus:border-rose-200 transition-all"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => onDate(e.target.value)}
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-semibold text-stone-700 border border-stone-100 outline-none"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-white border-t border-stone-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold active:scale-95 transition-all hover:bg-stone-200 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="moment-form"
              disabled={loading || files.length === 0}
              className="flex-[2] py-3.5 bg-rose-400 hover:bg-rose-500 text-white rounded-2xl text-sm font-bold disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Simpan Kenangan 💕</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}