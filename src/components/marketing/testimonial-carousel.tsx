"use client";

import { Quote, Star } from "lucide-react";
import { Carousel } from "@/components/marketing/carousel";
import { TESTIMONIALS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  name: string;
  role: string;
  rating: number;
  quote: string;
  avatar?: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_TINTS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-orange-500/10 text-orange-600 dark:text-orange-400",
];

/**
 * Student Success Stories carousel. Renders real approved course reviews when
 * `items` is provided (Chunk 5), falling back to the seed testimonials so the
 * homepage never looks empty before any reviews exist.
 */
export function TestimonialCarousel({ items }: { items?: TestimonialItem[] }) {
  const data: TestimonialItem[] = items && items.length ? items : [...TESTIMONIALS];

  return (
    <Carousel ariaLabel="Student success stories">
      {data.map((t, i) => (
        <figure
          key={`${t.name}-${i}`}
          className="flex w-[85%] shrink-0 snap-start flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-card sm:w-[360px]"
        >
          <div className="flex items-center justify-between">
            <Quote className="size-8 text-primary/25" aria-hidden />
            <div className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={cn(
                    "size-4",
                    s < t.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          </div>

          <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground">
            “{t.quote}”
          </blockquote>

          <figcaption className="flex items-center gap-3 border-t border-border pt-4">
            {t.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar host is arbitrary (OAuth), skip next/image domain allowlist
              <img
                src={t.avatar}
                alt={t.name}
                width={44}
                height={44}
                className="size-11 rounded-full object-cover"
              />
            ) : (
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full text-sm font-semibold",
                  AVATAR_TINTS[i % AVATAR_TINTS.length],
                )}
              >
                {initials(t.name)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">{t.name}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {t.role}
              </span>
            </span>
          </figcaption>
        </figure>
      ))}
    </Carousel>
  );
}
