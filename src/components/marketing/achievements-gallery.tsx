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
    /* Winner-slider shell: blue-tinted frosted panel wrapping the track. */
    <div className="relative overflow-hidden rounded-[25px] border border-white/30 bg-gradient-to-br from-blue-600/10 via-transparent to-sky-400/10 p-5 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/10 sm:p-8">
      <Carousel
        autoplay
        showCounter
        controls="center"
        ariaLabel={localize(lang, {
          en: "Student achievements",
          bn: "শিক্ষার্থীদের অর্জন",
        })}
      >
        {ACHIEVEMENTS.map((a) => (
          <article
            key={a.name}
            className="group flex w-[75%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/20 bg-card/80 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_15px_40px_rgba(37,99,235,0.2)] dark:border-white/10 sm:w-[300px]"
          >
            {/* Portrait tile — placeholder gradient with the student's initials.
                Swap for real winner photos when the client provides them. */}
            <div
              className={cn(
                "relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br",
                a.tint,
              )}
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-1 ring-white/40 backdrop-blur transition-transform duration-300 group-hover:scale-105">
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
              <p className="mt-3 inline-flex rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-primary">
                {localize(lang, a.program)}
              </p>
            </div>
          </article>
        ))}
      </Carousel>
    </div>
  );
}
