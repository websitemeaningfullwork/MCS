import { LogOut } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

const items: NavItem[] = [
  { href: "/mentor", label: "Overview", icon: "dashboard", exact: true },
  { href: "/mentor/programs", label: "My Programs", icon: "programs" },
  { href: "/mentor/questions", label: "Questions", icon: "questions" },
  { href: "/mentor/profile", label: "My Profile", icon: "profile" },
];

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMentor();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mentor
          </p>
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
