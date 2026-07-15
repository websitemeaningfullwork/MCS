import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official MCA brand lockup.
 *
 * The source artwork is navy/blue on transparent, so it's illegible on the
 * dark theme's deep-navy surfaces. Instead of masking it behind a plate we
 * swap in a dark-mode variant (`mca-logo-dark.webp`) whose navy wordmark +
 * book are recoloured light while the blue mark and gold star are kept — so
 * it blends straight into the background in both themes.
 *
 * Both variants are rendered and toggled with CSS (`dark:` visibility) to
 * avoid a theme-JS flash. Pass `priority` on above-the-fold placements
 * (navbar) so Next preloads it (Next 16 renamed the old `priority` prop to
 * `preload`).
 */
const LOGO_W = 816;
const LOGO_H = 306;
const sizeClass = "h-8 w-auto sm:h-9";
const sizes = "(max-width: 640px) 132px, 168px";

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
      <Image
        src="/brand/mca-logo.webp"
        alt="Meaningful Career Academy"
        width={LOGO_W}
        height={LOGO_H}
        preload={priority}
        sizes={sizes}
        className={cn(sizeClass, "dark:hidden")}
      />
      <Image
        src="/brand/mca-logo-dark.webp"
        alt="Meaningful Career Academy"
        width={LOGO_W}
        height={LOGO_H}
        preload={priority}
        sizes={sizes}
        className={cn("hidden dark:block", sizeClass)}
      />
    </Link>
  );
}
