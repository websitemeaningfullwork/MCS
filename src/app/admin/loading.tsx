import { Skeleton } from "@/components/ui/skeleton";

/** Table/list skeleton for the admin panel while data loads. */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="h-7 w-48" />
      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
