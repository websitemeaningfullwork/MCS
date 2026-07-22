"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free horizontal carousel built on CSS scroll-snap.
 * Children should be snap items (e.g. `snap-start shrink-0 w-[…]`).
 *
 * gogee8-style extras (all optional, off by default):
 * - `controls="center"` — circular glass prev/next arrows centered under the
 *   track with pagination dots between them (testimonial slider layout).
 * - `showCounter` — floating "current / total" pill over the track.
 * - `autoplay` — advances one page every `intervalMs`, wraps at the end,
 *   pauses on hover/touch and via the play/pause toggle. Disabled entirely
 *   for users who prefer reduced motion.
 */
export function Carousel({
  children,
  ariaLabel,
  className,
  controls = "end",
  showCounter = false,
  autoplay = false,
  intervalMs = 5000,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  controls?: "end" | "center";
  showCounter?: boolean;
  autoplay?: boolean;
  intervalMs?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [hovered, setHovered] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    const pageCount = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(pageCount);
    setPage(Math.min(pageCount - 1, Math.round(el.scrollLeft / el.clientWidth)));
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollByDir = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  const scrollToPage = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Autoplay loop — wraps back to the start once the end is reached.
  useEffect(() => {
    if (!autoplay || !playing || hovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, playing, hovered, intervalMs]);

  const dots = (
    <div className="flex items-center gap-2.5" role="tablist" aria-label="Slides">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === page}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => scrollToPage(i)}
          className={cn(
            "size-3 rounded-full transition-all duration-300",
            i === page
              ? "scale-125 bg-primary shadow-[0_0_16px_rgba(37,99,235,0.5)]"
              : "bg-primary/30 hover:scale-110 hover:bg-primary/60",
          )}
        />
      ))}
    </div>
  );

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      {showCounter ? (
        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-slate-900/60 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          {page + 1} / {pages}
        </span>
      ) : null}

      {autoplay ? (
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause autoplay" : "Start autoplay"}
          className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/30 bg-card/60 text-primary shadow-card backdrop-blur-md transition-all hover:scale-110 hover:bg-card/80"
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </button>
      ) : null}

      <div
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {controls === "center" ? (
        <div className="mt-8 flex items-center justify-center gap-6">
          <CarouselButton
            direction="prev"
            disabled={atStart}
            onClick={() => scrollByDir(-1)}
          />
          {dots}
          <CarouselButton
            direction="next"
            disabled={atEnd}
            onClick={() => scrollByDir(1)}
          />
        </div>
      ) : (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="hidden sm:block">{pages > 1 ? dots : null}</div>
          <div className="flex items-center gap-2">
            <CarouselButton
              direction="prev"
              disabled={atStart}
              onClick={() => scrollByDir(-1)}
            />
            <CarouselButton
              direction="next"
              disabled={atEnd}
              onClick={() => scrollByDir(1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous" : "Next"}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-white/30 bg-card/60 text-primary shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg dark:border-white/10",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
