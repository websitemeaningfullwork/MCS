"use client";

import { Quote, Star } from "lucide-react";
import { Carousel } from "@/components/marketing/carousel";
import { useLanguage } from "@/components/shared/language-provider";
import { TESTIMONIALS } from "@/lib/constants";
import { localize } from "@/lib/i18n";
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

/* Gradient avatar tints cycle per card so the wall reads colorful. */
const AVATAR_GRADIENTS = [
  "from-blue-600 to-sky-400",
  "from-violet-600 to-fuchsia-400",
  "from-amber-500 to-orange-400",
  "from-sky-500 to-cyan-400",
  "from-rose-500 to-pink-400",
  "from-indigo-600 to-blue-400",
];

/**
 * Student Success Stories carousel. Renders real approved course reviews when
 * `items` is provided (Chunk 5), falling back to the seed testimonials so the
 * homepage never looks empty before any reviews exist. Seed copy is bilingual
 * and resolves to the active language; real review bodies render as written.
 */
export function TestimonialCarousel({ items }: { items?: TestimonialItem[] }) {
  const { lang } = useLanguage();
  const data: TestimonialItem[] =
    items && items.length
      ? items
      : TESTIMONIALS.map((t) => ({
          name: t.name,
          rating: t.rating,
          role: localize(lang, t.role),
          quote: localize(lang, t.quote),
        }));

  return (
    <div className="relative">
      {/* Slow-floating decorative circles behind the slider. */}
      <div
        aria-hidden
        className="anim-floaty pointer-events-none absolute -right-6 -top-10 size-24 rounded-full bg-sky-400/10 backdrop-blur-md"
      />
      <div
        aria-hidden
        className="anim-floaty pointer-events-none absolute -bottom-8 -left-6 size-24 rounded-full bg-blue-500/10 backdrop-blur-md [animation-delay:4s]"
      />

      <Carousel
        controls="center"
        ariaLabel={localize(lang, {
          en: "Student success stories",
          bn: "শিক্ষার্থীদের সাফল্যের গল্প",
        })}
      >
        {data.map((t, i) => (
          <figure
            key={`${t.name}-${i}`}
            className="glass-card relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[360px]"
          >
            {/* Top gradient accent bar */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"
            />

            {/* Quote icon medallion */}
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_5px_15px_rgba(37,99,235,0.25)]">
              <Quote className="size-5 fill-current" aria-hidden />
            </span>

            <div
              className="mt-4 flex items-center justify-center gap-1"
              aria-label={`${t.rating} out of 5`}
            >
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

            <blockquote className="mt-4 flex-1 text-[15px] italic leading-relaxed text-foreground/90">
              “{t.quote}”
            </blockquote>

            <figcaption className="mt-6 flex flex-col items-center">
              {t.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar host is arbitrary (OAuth), skip next/image domain allowlist
                <img
                  src={t.avatar}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover shadow-md"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-md",
                    AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                  )}
                >
                  {initials(t.name)}
                </span>
              )}
              <span className="mt-3 block font-semibold text-foreground">
                {t.name}
              </span>
              <span className="mt-1.5 inline-block max-w-full truncate rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-primary">
                {t.role}
              </span>
            </figcaption>
          </figure>
        ))}
      </Carousel>
    </div>
  );
}
