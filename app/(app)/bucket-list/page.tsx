import { getBucketList } from "@/actions/bucketList";
import { getCoupleInfo } from "@/actions/couple";
import { BucketItemCard } from "@/components/bucket-list/BucketItem";
import { BucketForm } from "@/components/bucket-list/BucketForm";
import { Pagination } from "@/components/ui/Pagination";
import { ListChecks } from "lucide-react";
 
export default async function BucketListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;
 
  const [{ items, totalPages }, coupleInfo] = await Promise.all([
    getBucketList(currentPage, pageSize),
    getCoupleInfo(),
  ]);
 
  const completed = items.filter((i) => i.completed);
  const pending   = items.filter((i) => !i.completed);
 
  const memberMap = Object.fromEntries(
    coupleInfo?.members.map((m) => [m.id, m.name.split(" ")[0]]) ?? []
  );
 
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Bucket List</h1>
          <p className="text-sm text-stone-400 mt-1">
            {completed.length} dari {items.length} selesai
          </p>
        </div>
        <BucketForm desktopTrigger />
      </div>
 
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(completed.length / items.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5 text-right">
            {Math.round((completed.length / items.length) * 100)}% selesai
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
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Belum selesai — {pending.length}
              </p>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {pending.map((item) => (
                   <BucketItemCard
                     key={item.id}
                     item={item}
                     completedByName={item.completedBy ? memberMap[item.completedBy] : undefined}
                   />
                 ))}
               </div>
            </div>
          )}
 
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Selesai — {completed.length} 🎉
              </p>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {completed.map((item) => (
                   <BucketItemCard
                     key={item.id}
                     item={item}
                     completedByName={item.completedBy ? memberMap[item.completedBy] : undefined}
                   />
                 ))}
               </div>
            </div>
          )}
 
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            baseUrl="/bucket-list" 
          />
        </div>
      )}
 
      <BucketForm />
    </>
  );
}
