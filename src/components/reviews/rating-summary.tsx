import { Stars } from "./stars";
import type { RatingSummary as Summary } from "./types";

/**
 * "4.9 out of 5" + a 5→1 star histogram, matching `admin panel course.jpg`.
 * Bars use amber (ratings), not green — green stays reserved for status.
 */
export function RatingSummary({ summary }: { summary: Summary }) {
  const { average, count, histogram } = summary;
  const max = Math.max(1, ...histogram);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="shrink-0 text-center sm:text-left">
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tracking-tight text-foreground">
            {average.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">out of 5</span>
        </div>
        <Stars rating={average} className="mt-1 justify-center sm:justify-start" />
        <p className="mt-1 text-xs text-muted-foreground">
          Based on {count} review{count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = histogram[star - 1];
          const pct = Math.round((n / max) * 100);
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-12 shrink-0 text-muted-foreground">{star} Star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
