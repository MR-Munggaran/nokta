import { Suspense } from "react";
import BucketDetail from "./bucket-detail";
import { notFound } from "next/navigation";

export default async function BucketDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = Number(params.id);

  if (isNaN(id)) return notFound();

  return (
    <Suspense fallback={<div className="text-sm text-stone-400">Memuat...</div>}>
      <BucketDetail id={id} />
    </Suspense>
  );
}
