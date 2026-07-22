import { LogOut } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

const items: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
  { href: "/admin/payments", label: "Payment Requests", icon: "payments" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/mentors", label: "Mentors", icon: "mentors" },
  { href: "/admin/programs", label: "Programs", icon: "admin-programs" },
  { href: "/admin/resources", label: "Resources", icon: "resources" },
  { href: "/admin/blog", label: "Blog", icon: "blog" },
  { href: "/admin/questions", label: "Questions", icon: "questions" },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews" },
  { href: "/admin/live-classes", label: "Live Classes", icon: "live" },
  { href: "/admin/mock-tests", label: "Mock Tests", icon: "tests" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Admin
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
