import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "size-3.5", md: "size-4", lg: "size-5" } as const;

/**
 * Read-only star row. Amber = rating (per the brand rule green is status-only, so
 * ratings use amber/gold). Safe in both server and client components.
 */
export function Stars({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            SIZES[size],
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}
