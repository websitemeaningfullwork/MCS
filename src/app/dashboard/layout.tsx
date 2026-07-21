import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { type NavItem } from "@/components/dashboard/sidebar-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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

  return <DashboardShell items={items}>{children}</DashboardShell>;
}
