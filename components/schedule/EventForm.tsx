"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { createScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from "@/actions/schedule";
import { CATEGORY_META, HOURS } from "@/lib/scheduleUtils";
import type { ScheduleEvent, EventCategory } from "@/db/schema";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Props {
  event?:        ScheduleEvent;
  defaultDate?:  string;
  defaultHour?:  string;
  onClose:       () => void;
  /** Called when user clicks the copy button on an existing event */
  onCopy?:       (ev: ScheduleEvent) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function EventForm({ event, defaultDate, defaultHour = "09.00", onClose, onCopy }: Props) {
  const router    = useRouter();
  const [pending, startTransition] = useTransition();

  const isEdit = !!event;

  const [title,    setTitle]    = useState(event?.title     ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category as EventCategory ?? "other");
  const [date,     setDate]     = useState(event?.eventDate ?? defaultDate ?? new Date().toISOString().split("T")[0]);
  const [start,    setStart]    = useState(event?.startTime ?? defaultHour);
  const [end,      setEnd]      = useState(event?.endTime   ?? "");
  const [note,     setNote]     = useState(event?.note      ?? "");

  function handleSubmit() {
    if (!title.trim()) { toast.error("Nama kegiatan wajib diisi"); return; }

    startTransition(async () => {
      const payload = { title: title.trim(), category, eventDate: date, startTime: start, endTime: end || undefined, note: note || undefined };

      const result = isEdit
        ? await updateScheduleEvent({ ...payload, id: event!.id })
        : await createScheduleEvent(payload);

      if (!result.success) { toast.error(result.error); return; }

      toast.success(isEdit ? "Kegiatan diperbarui ✓" : "Kegiatan ditambahkan! 🎉");
      router.refresh();
      onClose();
    });
  }

  function handleDelete() {
    if (!event) return;
    if (!confirm(`Hapus "${event.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteScheduleEvent(event.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Kegiatan dihapus");
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center pb-22 sm:items-center sm:p-4">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="w-[calc(100%-2rem)] max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">
            {isEdit ? "Edit Kegiatan" : "Tambah Kegiatan"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Kategori
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.entries(CATEGORY_META) as [EventCategory, typeof CATEGORY_META[EventCategory]][]).map(
                ([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all
                      ${category === key
                        ? `${meta.pillBg} ${meta.pillText} border-current`
                        : "bg-stone-50 text-stone-500 border-transparent hover:bg-stone-100"}`}
                  >
                    <span className="text-base">{meta.emoji}</span>
                    <span className="leading-none">{meta.label}</span>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Nama Kegiatan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Nonton bareng, Meeting, Olahraga pagi"
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Jam Mulai
              </label>
              <select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Jam Selesai <span className="normal-case font-normal">(opsional)</span>
              </label>
              <select
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200"
              >
                <option value="">—</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Catatan <span className="normal-case font-normal">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan atau rencana detail..."
              rows={3}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 placeholder-stone-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          {isEdit && (
            <>
              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={pending}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Copy – only in edit mode */}
              {onCopy && (
                <button
                  onClick={() => { onCopy(event!); onClose(); }}
                  disabled={pending}
                  title="Salin kegiatan ini"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            disabled={pending}
            className="flex-1 py-3.5 bg-stone-100 text-stone-500 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending}
            className="flex-2 py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center hover:bg-emerald-600 transition-colors"
          >
            {pending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isEdit ? "Simpan Perubahan" : "Tambahkan 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}