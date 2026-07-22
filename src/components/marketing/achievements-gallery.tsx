"use client";

import { Award } from "lucide-react";
import { Carousel } from "@/components/marketing/carousel";
import { useLanguage } from "@/components/shared/language-provider";
import { ACHIEVEMENTS } from "@/lib/constants";
import { localize } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AchievementsGallery() {
  const { lang } = useLanguage();
  return (
    <Carousel
      ariaLabel={localize(lang, {
        en: "Student achievements",
        bn: "শিক্ষার্থীদের অর্জন",
      })}
    >
      {ACHIEVEMENTS.map((a) => (
        <article
          key={a.name}
          className="card-hover flex w-[75%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card sm:w-[300px]"
        >
          {/* Portrait tile — placeholder gradient with the student's initials.
              Swap for real winner photos when the client provides them. */}
          <div
            className={cn(
              "relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br",
              a.tint,
            )}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-1 ring-white/40 backdrop-blur">
              {initials(a.name)}
            </span>
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <Award className="size-3.5 text-amber-500" />
              {localize(lang, { en: "Winner", bn: "বিজয়ী" })}
            </span>
          </div>

          <div className="p-5">
            <h3 className="font-semibold text-foreground">{a.name}</h3>
            <p className="mt-1 text-sm text-foreground/80">
              {localize(lang, a.achievement)}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {localize(lang, a.program)}
            </p>
          </div>
        </article>
      ))}
    </Carousel>
  );
}
