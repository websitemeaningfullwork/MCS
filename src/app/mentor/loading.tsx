import { Skeleton } from "@/components/ui/skeleton";

/** Content skeleton for the mentor panel while data loads. */
export default function MentorLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Skeleton className="h-7 w-56" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
