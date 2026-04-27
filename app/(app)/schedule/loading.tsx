import { Skeleton } from "@/components/ui/Skeleton";

export default function ScheduleLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl hidden md:block" />
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-52 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-16 rounded" />
        ))}
      </div>

      {/* Calendar grid */}
      <Skeleton className="h-120 w-full rounded-2xl" />
    </div>
  );
}