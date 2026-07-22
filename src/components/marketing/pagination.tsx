"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "@/components/shared/t";
import { cn } from "@/lib/utils";

/**
 * Server-friendly pagination: builds `?page=N` links that preserve all other
 * query params (search, filters). Renders nothing when there's a single page.
 */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={href(page - 1)}
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(base, prevDisabled && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="px-2 text-sm text-muted-foreground" aria-current="page">
        <T en={`Page ${page} of ${totalPages}`} bn={`পৃষ্ঠা ${page} / ${totalPages}`} />
      </span>
      <Link
        href={href(page + 1)}
        aria-label="Next page"
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(base, nextDisabled && "pointer-events-none opacity-40")}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
