import Image from "next/image";
import Link from "next/link";
import { Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBDT, effectivePriceBDT, hasDiscount, levelLabel } from "@/lib/format";
import type { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";

type ProgramCardData = Pick<
  Tables<"programs">,
  | "slug"
  | "title"
  | "subtitle"
  | "cover_url"
  | "price_bdt"
  | "discount_bdt"
  | "level"
  | "rating"
  | "reviews_count"
  | "enrolled_count"
  | "is_bestseller"
>;

export function ProgramCard({
  program,
  className,
  mentorName,
}: {
  program: ProgramCardData;
  className?: string;
  mentorName?: string | null;
}) {
  const price = effectivePriceBDT(program.price_bdt, program.discount_bdt);
  const showDiscount = hasDiscount(program.price_bdt, program.discount_bdt);
  const rating = program.rating ?? 0;
  const enrolled = program.enrolled_count ?? 0;

  return (
    <Link
      href={`/programs/${program.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30",
        className,
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15">
        {program.cover_url ? (
          <Image
            src={program.cover_url}
            alt={program.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-3xl font-semibold text-primary/40">
              {program.title.charAt(0)}
            </span>
          </div>
        )}
        {program.is_bestseller ? (
          <Badge className="absolute left-3 top-3 bg-warning text-primary-foreground">
            Bestseller
          </Badge>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{levelLabel(program.level)}</span>
          {rating > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-warning text-warning" />
                {rating.toFixed(1)}
                {program.reviews_count ? (
                  <span className="text-muted-foreground">
                    ({program.reviews_count})
                  </span>
                ) : null}
              </span>
            </>
          ) : null}
          {enrolled > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {enrolled.toLocaleString("en-US")}
              </span>
            </>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">
          {program.title}
        </h3>
        {program.subtitle ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {program.subtitle}
          </p>
        ) : null}

        {mentorName ? (
          <p className="mt-2 text-xs text-muted-foreground">with {mentorName}</p>
        ) : null}

        <div className="mt-auto flex items-baseline gap-2 pt-4">
          <span className="text-lg font-semibold text-foreground">
            {formatBDT(price)}
          </span>
          {showDiscount ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatBDT(program.price_bdt)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
