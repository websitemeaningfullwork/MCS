import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBDT } from "@/lib/format";
import type { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";

export const RESOURCE_KIND_LABELS: Record<string, string> = {
  ebook: "E-book",
  cv_template: "CV Template",
  roadmap: "Roadmap",
  interview: "Interview Prep",
  productivity: "Productivity",
  scholarship: "Scholarship",
  other: "Resource",
};

type ResourceCardData = Pick<
  Tables<"resources">,
  "slug" | "title" | "author" | "kind" | "cover_url" | "price_bdt"
>;

export function ResourceCard({
  resource,
  className,
}: {
  resource: ResourceCardData;
  className?: string;
}) {
  return (
    <Link
      href={`/resources/${resource.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30",
        className,
      )}
    >
      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15">
        {resource.cover_url ? (
          <Image
            src={resource.cover_url}
            alt={resource.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <BookOpen className="size-10 text-primary/40" />
        )}
        <Badge variant="secondary" className="absolute left-3 top-3">
          {RESOURCE_KIND_LABELS[resource.kind] ?? "Resource"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {resource.title}
        </h3>
        {resource.author ? (
          <p className="mt-1 text-xs text-muted-foreground">by {resource.author}</p>
        ) : null}
        <span className="mt-auto pt-3 font-semibold text-foreground">
          {formatBDT(resource.price_bdt)}
        </span>
      </div>
    </Link>
  );
}
