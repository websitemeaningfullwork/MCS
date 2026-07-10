import { Skeleton } from "@/components/ui/skeleton";

/** Content skeleton for the student dashboard while data loads. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Skeleton className="h-7 w-56" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
