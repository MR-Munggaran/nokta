import { getLetters } from "@/actions/letters";
import { getSession } from "@/actions/auth";
import { LetterCard } from "@/components/letters/LetterCard";
import { LetterForm } from "@/components/letters/LetterForm";
import { BookHeart } from "lucide-react";

export default async function LettersPage() {
  const [letters, session] = await Promise.all([
    getLetters(),
    getSession(),
  ]);

  if (!session.ok) return null;

  const myLetters      = letters.filter((l) => l.authorId === session.userId);
  const partnerLetters = letters.filter((l) => l.authorId !== session.userId);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Surat & Catatan</h1>
        <p className="text-sm text-stone-400 mt-1">
          {letters.length} surat tersimpan
        </p>
      </div>

      {/* Empty state */}
      {letters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-pink-50 flex items-center justify-center mb-4">
            <BookHeart className="w-9 h-9 text-pink-400" />
          </div>
          <h2 className="font-semibold text-lg text-stone-700 mb-1">Belum ada surat</h2>
          <p className="text-sm text-stone-400 max-w-[220px] leading-relaxed">
            Tulis pesan atau ungkapan hati untuk pasanganmu
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Surat dari pasangan */}
          {partnerLetters.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Dari Pasangan — {partnerLetters.length}
              </p>
              {partnerLetters.map((letter) => (
                <LetterCard
                  key={letter.id}
                  letter={letter}
                  currentUserId={session.userId}
                />
              ))}
            </div>
          )}

          {/* Suratku */}
          {myLetters.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Suratku — {myLetters.length}
              </p>
              {myLetters.map((letter) => (
                <LetterCard
                  key={letter.id}
                  letter={letter}
                  currentUserId={session.userId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <LetterForm />
    </>
  );
}