import { BadgeCheck } from "lucide-react";

import { Stars } from "./stars";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicReview } from "./types";

function initials(name: string | null) {
  if (!name) return "MCA";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** A single approved review — used on the program page and course Reviews tab. */
export function ReviewCard({
  review,
  className,
}: {
  review: PublicReview;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {review.reviewer_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar host is arbitrary (OAuth), skip next/image domain allowlist
          <img
            src={review.reviewer_avatar}
            alt={review.reviewer_name ?? "Student"}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(review.reviewer_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-foreground">
              {review.reviewer_name ?? "MCA Student"}
            </span>
            {review.verified_buyer ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" />
                Verified Buyer
              </span>
            ) : null}
          </div>
          <Stars rating={review.rating} size="sm" className="mt-0.5" />
        </div>
      </div>

      {review.body ? (
        <blockquote className="text-sm leading-relaxed text-muted-foreground">
          {review.body}
        </blockquote>
      ) : null}

      <figcaption className="text-xs text-muted-foreground">
        {timeAgo(review.created_at)}
      </figcaption>
    </figure>
  );
}
