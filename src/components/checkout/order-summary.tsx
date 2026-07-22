import Image from "next/image";
import { Infinity as InfinityIcon, Star, Users } from "lucide-react";

/**
 * Order-summary card — the "what am I buying" hero of the left column:
 * thumbnail, title, description, rating, student count, lifetime-access badge.
 */
export function OrderSummaryCard({
  title,
  subtitle,
  coverUrl,
  rating,
  reviewsCount,
  enrolledCount,
}: {
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  enrolledCount: number | null;
}) {
  const ratingValue = rating ?? 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="flex gap-4 p-5 sm:p-6">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/15 via-secondary to-sky-400/15 sm:size-28">
          {coverUrl ? (
            <Image src={coverUrl} alt={title} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600/40">
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {ratingValue > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{ratingValue.toFixed(1)}</span>
                {reviewsCount ? <span>({reviewsCount})</span> : null}
              </span>
            ) : null}
            {enrolledCount && enrolledCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {enrolledCount.toLocaleString("en-US")} students
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-border px-5 py-3 sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <InfinityIcon className="size-3.5" />
          Lifetime Access
        </span>
      </div>
    </section>
  );
}
