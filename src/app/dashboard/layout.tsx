import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard", exact: true },
  { href: "/dashboard/programs", label: "My Programs", icon: "programs" },
  { href: "/dashboard/resources", label: "My Resources", icon: "resources" },
  { href: "/dashboard/bookmarks", label: "Saved", icon: "bookmarks" },
  { href: "/dashboard/orders", label: "My Orders", icon: "orders" },
  { href: "/dashboard/questions", label: "Ask a Mentor", icon: "questions" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

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
