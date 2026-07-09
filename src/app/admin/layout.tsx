import {
  BadgeDollarSign,
  BookMarked,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestion,
  Radio,
  Settings,
  Users,
  ClipboardList,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { SidebarNav, type NavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

const items: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/payments", label: "Payment Requests", icon: BadgeDollarSign },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/mentors", label: "Mentors", icon: GraduationCap },
  { href: "/admin/programs", label: "Programs", icon: BookMarked },
  { href: "/admin/resources", label: "Resources", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: MessageCircleQuestion },
  { href: "/admin/live-classes", label: "Live Classes", icon: Radio },
  { href: "/admin/mock-tests", label: "Mock Tests", icon: ClipboardList },
  { href: "/admin/settings", label: "Payment Settings", icon: Settings },
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
