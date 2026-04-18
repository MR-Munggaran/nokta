import { Skeleton } from "@/components/ui/Skeleton";

export default function BucketListLoading() {
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

      {/* Progress Bar Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-20 ml-auto mt-2" />
      </div>

      {/* List Skeletons */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
