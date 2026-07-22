import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { T } from "@/components/shared/t";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = <T en="View all" bn="সব দেখুন" />,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  linkLabel?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto flex max-w-2xl flex-col items-center")}>
        {eyebrow ? (
          <p className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_5px_15px_rgba(37,99,235,0.25)]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "title-underline mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
            align === "center" && "title-underline-center",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-transform hover:translate-x-1 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
