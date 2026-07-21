"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free horizontal carousel built on CSS scroll-snap.
 * Children should be snap items (e.g. `snap-start shrink-0 w-[…]`). Arrow
 * buttons scroll by ~80% of the viewport and disable at the ends.
 */
export function Carousel({
  children,
  ariaLabel,
  className,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
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

  const scrollByDir = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        role="group"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
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
        "flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-card transition-all hover:bg-secondary",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
