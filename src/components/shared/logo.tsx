import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Meaningful Career Academy — home"
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="relative flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        M
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand-hover" />
      </span>
      <span>
        MCA
        <span className="ml-1 hidden text-sm font-normal text-muted-foreground sm:inline">
          Meaningful Career Academy
        </span>
      </span>
    </Link>
  );
}
