import { Skeleton } from "@/components/ui/Skeleton";

export default function DatesLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Featured Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
