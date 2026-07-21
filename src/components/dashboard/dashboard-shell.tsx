"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

/**
 * Dashboard chrome. Most dashboard pages render inside the sidebar + max-width
 * grid. The immersive course player (`/dashboard/learn/...`) opts out of that
 * chrome and uses the full page width instead — a nested layout can't drop a
 * parent layout, so we branch on the pathname here.
 */
export function DashboardShell({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const immersive = pathname?.startsWith("/dashboard/learn/") ?? false;

  if (immersive) {
    return <div className="mx-auto w-full max-w-[1500px] px-4 py-6">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SidebarNav items={items} />
          <div className="mt-2 hidden border-t border-border pt-2 lg:block">
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
