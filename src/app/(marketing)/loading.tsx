import { Skeleton } from "@/components/ui/skeleton";

/** Card-grid skeleton for marketing list/detail routes. */
export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <Skeleton className="mt-4 h-9 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
