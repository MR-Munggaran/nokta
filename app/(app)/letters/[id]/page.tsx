// app/letters/[id]/page.tsx
import { Suspense } from "react";
import LetterDetail from "./letter-detail";
import { notFound } from "next/navigation";

export default async function LetterDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  return (
    <Suspense fallback={<div className="text-sm text-stone-400">Memuat...</div>}>
      <LetterDetail id={id} />
    </Suspense>
  );
}