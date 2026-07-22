"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interactive 1–5 star picker. Amber (ratings), per the brand rule. */
export function StarInput({
  value,
  onChange,
  disabled,
  size = "lg",
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const cls = size === "lg" ? "size-7" : "size-5";

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cn(
            "rounded-sm transition-transform disabled:cursor-not-allowed",
            !disabled && "hover:scale-110",
          )}
        >
          <Star
            className={cn(
              cls,
              n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
