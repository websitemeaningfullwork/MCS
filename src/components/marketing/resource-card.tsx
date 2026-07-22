import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { T } from "@/components/shared/t";
import { formatBDT } from "@/lib/format";
import type { Bi } from "@/lib/i18n";
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

/** Bilingual kind labels (badge + filter options). */
export const RESOURCE_KIND_LABELS_BI: Record<string, Bi> = {
  ebook: { en: "E-book", bn: "ই-বুক" },
  cv_template: { en: "CV Template", bn: "সিভি টেমপ্লেট" },
  roadmap: { en: "Roadmap", bn: "রোডম্যাপ" },
  interview: { en: "Interview Prep", bn: "ইন্টারভিউ প্রস্তুতি" },
  productivity: { en: "Productivity", bn: "প্রোডাক্টিভিটি" },
  scholarship: { en: "Scholarship", bn: "স্কলারশিপ" },
  other: { en: "Resource", bn: "রিসোর্স" },
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
          <T {...(RESOURCE_KIND_LABELS_BI[resource.kind] ?? RESOURCE_KIND_LABELS_BI.other)} />
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">
          {resource.title}
        </h3>
        {resource.author ? (
          <p className="mt-1 text-xs text-muted-foreground">
            <T en={`by ${resource.author}`} bn={`লেখক: ${resource.author}`} />
          </p>
        ) : null}
        <span className="mt-auto pt-3 font-semibold text-foreground">
          {resource.price_bdt && resource.price_bdt > 0 ? (
            formatBDT(resource.price_bdt)
          ) : (
            <T en="Free" bn="ফ্রি" />
          )}
        </span>
      </div>
    </Link>
  );
}
