// app/letters/[id]/letter-detail.tsx
import { getLetterById } from "@/actions/letters";
import { getSession } from "@/actions/auth";
import { notFound } from "next/navigation";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function LetterDetail({ id }: { id: number }) {
  const [session, letter] = await Promise.all([
    getSession(),
    getLetterById(id),
  ]);

  if (!session.ok || !letter) return notFound();

  const isOwn = letter.authorId === session.userId;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">{letter.title}</h1>
        <p className="text-sm text-stone-400 mt-1">
          {isOwn ? "Kamu" : letter.author.name.split(" ")[0]} ·{" "}
          {formatDate(letter.createdAt)}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
          {letter.content}
        </p>
      </div>
    </div>
  );
}