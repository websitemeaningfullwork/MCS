import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official MCA brand lockup. The source artwork is navy/blue on transparent,
 * so on the dark theme (where surfaces are deep navy) we sit it on a small
 * white plate — this keeps the full-colour mark + gold star legible instead
 * of inverting it to a flat monochrome.
 *
 * Pass `priority` on above-the-fold placements (navbar) so Next preloads it
 * (Next 16 renamed the old `priority` prop to `preload`).
 */
export function Logo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Meaningful Career Academy — home"
      className={cn("inline-flex items-center", className)}
    >
      <span className="inline-flex items-center rounded-lg p-1 dark:bg-white dark:shadow-sm">
        <Image
          src="/brand/mca-logo.webp"
          alt="Meaningful Career Academy"
          width={816}
          height={306}
          preload={priority}
          sizes="(max-width: 640px) 132px, 168px"
          className="h-8 w-auto sm:h-9"
        />
      </span>
    </Link>
  );
}
