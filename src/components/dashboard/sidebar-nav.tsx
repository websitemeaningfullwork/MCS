"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  BookMarked,
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircleQuestion,
  Radio,
  Receipt,
  Settings,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon registry — server layouts pass a string key (functions can't cross
 *  the server→client boundary as props). */
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  programs: GraduationCap,
  resources: BookOpen,
  bookmarks: BookMarked,
  orders: Receipt,
  questions: MessageCircleQuestion,
  settings: Settings,
  payments: BadgeDollarSign,
  users: Users,
  mentors: GraduationCap,
  "admin-programs": BookMarked,
  blog: FileText,
  live: Radio,
  tests: ClipboardList,
  profile: UserRound,
  reviews: Star,
  appointments: CalendarClock,
};

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
