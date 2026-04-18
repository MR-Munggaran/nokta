import { Skeleton } from "@/components/ui/Skeleton";

export default function LettersLoading() {
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

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full mb-3 rounded-xl" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full mb-3 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
