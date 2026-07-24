import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the booking wizard's header, stepper and first step card. */
export default function AppointmentsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="flex flex-col items-center">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>

      {/* Stepper */}
      <div className="mt-8 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2 last:flex-none">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            {i < 4 ? <Skeleton className="h-0.5 flex-1 rounded-full" /> : null}
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
