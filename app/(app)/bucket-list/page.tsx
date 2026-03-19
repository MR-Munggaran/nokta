import { getBucketList } from "@/actions/bucketList";
import { getCoupleInfo } from "@/actions/couple";
import { getSession } from "@/actions/auth";
import { BucketItemCard } from "@/components/bucket-list/BucketItem";
import { BucketForm } from "@/components/bucket-list/BucketForm";
import { ListChecks } from "lucide-react";

export default async function BucketListPage() {
  const [items, coupleInfo, session] = await Promise.all([
    getBucketList(),
    getCoupleInfo(),
    getSession(),
  ]);

  const completed = items.filter((i) => i.completed);
  const pending   = items.filter((i) => !i.completed);

  // Map userId → name untuk label "diselesaikan oleh"
  const memberMap = Object.fromEntries(
    coupleInfo?.members.map((m) => [m.id, m.name.split(" ")[0]]) ?? []
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Bucket List</h1>
        <p className="text-sm text-stone-400 mt-1">
          {completed.length} dari {items.length} selesai
        </p>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${items.length ? (completed.length / items.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5 text-right">
            {Math.round(items.length ? (completed.length / items.length) * 100 : 0)}% selesai
          </p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-4">
            <ListChecks className="w-9 h-9 text-amber-400" />
          </div>
          <h2 className="font-semibold text-lg text-stone-700 mb-1">Bucket list masih kosong</h2>
          <p className="text-sm text-stone-400 max-w-[220px] leading-relaxed">
            Tambahkan hal-hal yang ingin kalian lakukan bersama
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending items */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Belum selesai — {pending.length}
              </p>
              {pending.map((item) => (
                <BucketItemCard
                  key={item.id}
                  item={item}
                  completedByName={item.completedBy ? memberMap[item.completedBy] : undefined}
                />
              ))}
            </div>
          )}

          {/* Completed items */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Selesai — {completed.length} 🎉
              </p>
              {completed.map((item) => (
                <BucketItemCard
                  key={item.id}
                  item={item}
                  completedByName={item.completedBy ? memberMap[item.completedBy] : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <BucketForm />
    </>
  );
}