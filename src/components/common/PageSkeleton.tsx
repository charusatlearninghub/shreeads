import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page-shaped shimmer placeholder shown while a route transition
 * is in flight. Mirrors the common layout: hero block + section header + card grid.
 */
export function PageSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
      {/* Hero */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 rounded-full motion-reduce:animate-none" />
        <Skeleton className="h-10 sm:h-14 w-4/5 motion-reduce:animate-none" />
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-36 motion-reduce:animate-none" />
          <Skeleton className="h-11 w-28 motion-reduce:animate-none" />
        </div>
      </div>

      {/* Section header */}
      <div className="mt-14 space-y-3">
        <Skeleton className="h-6 w-52 motion-reduce:animate-none" />
        <Skeleton className="h-4 w-72 max-w-full motion-reduce:animate-none" />
      </div>

      {/* Card grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg motion-reduce:animate-none" />
            <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full motion-reduce:animate-none" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20 motion-reduce:animate-none" />
              <Skeleton className="h-9 w-24 rounded-lg motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageSkeleton;
