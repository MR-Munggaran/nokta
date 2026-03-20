"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLetter, updateLetter } from "@/actions/letters";
import { toast } from "sonner";
import { Trash2, Pencil, X, Check, BookHeart, ChevronDown, ChevronUp } from "lucide-react";
import type { LetterWithAuthor } from "@/actions/letters";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });
}

export function LetterCard({
  letter,
  currentUserId,
}: {
  letter:        LetterWithAuthor;
  currentUserId: string;
}) {
  const router  = useRouter();
  const isOwn   = letter.authorId === currentUserId;
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [title, setTitle]       = useState(letter.title);
  const [content, setContent]   = useState(letter.content);

  async function handleDelete() {
    if (!confirm(`Hapus "${letter.title}"?`)) return;
    setBusy(true);
    const result = await deleteLetter(letter.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Surat dihapus");
    router.refresh();
  }

  async function handleUpdate() {
    if (!title.trim() || !content.trim()) return toast.error("Judul dan isi wajib diisi.");
    setBusy(true);
    const result = await updateLetter(letter.id, { title, content });
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Surat diperbarui!");
    setEditing(false);
    router.refresh();
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      isOwn ? "border-stone-100" : "border-pink-100"
    }`}>
      {/* From partner badge */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-pink-50 border-b border-pink-100">
          <BookHeart className="w-3 h-3 text-pink-400" />
          <span className="text-[11px] font-medium text-pink-400">
            Dari {letter.author.name.split(" ")[0]}
          </span>
        </div>
      )}

      {/* Header — div bukan button supaya bisa ada button di dalamnya */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors select-none"
        onClick={() => { if (!editing) setExpanded((v) => !v); }}
      >
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-stone-50 rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-800 border border-stone-200 outline-none focus:ring-2 focus:ring-stone-200"
            />
          ) : (
            <p className="font-semibold text-sm text-stone-800 truncate">{letter.title}</p>
          )}
          <p className="text-xs text-stone-400 mt-0.5">
            {isOwn ? "Kamu" : letter.author.name.split(" ")[0]} · {formatDate(letter.createdAt)}
          </p>
        </div>

        {/* Actions — hanya untuk author */}
        {isOwn && (
          <div
            className="flex gap-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {editing ? (
              <>
                <button
                  onClick={handleUpdate}
                  disabled={busy}
                  className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setTitle(letter.title);
                    setContent(letter.content);
                  }}
                  className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setEditing(true); setExpanded(true); }}
                  className="w-8 h-8 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Expand indicator */}
        {!isOwn && (
          <div className="flex-shrink-0 text-stone-300">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-50 pt-3">
          {editing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-700 border border-stone-100 outline-none focus:ring-2 focus:ring-stone-200 resize-none"
            />
          ) : (
            <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
              {letter.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}