import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-5xl items-center px-4 py-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card md:grid-cols-2">
        {/* Brand panel (desktop only) */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-secondary to-card p-10 md:flex">
          <Logo />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Guidance, not just courses.
            </h2>
            <p className="mt-3 max-w-sm text-muted-foreground">
              Join a premium, mentorship-first academy. Learn from experienced
              mentors, follow a structured path, and build a meaningful career.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Meaningful Career Academy
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-sm">
            <div className="md:hidden">
              <Logo />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground md:mt-0">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}

            <div className="mt-8">{children}</div>

            {footer ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
