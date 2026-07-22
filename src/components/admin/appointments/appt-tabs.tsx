"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/appointments", label: "Dashboard", exact: true },
  { href: "/admin/appointments/all", label: "All Appointments" },
  { href: "/admin/appointments/calendar", label: "Calendar View" },
  { href: "/admin/appointments/schedule", label: "Mentor Schedule" },
  { href: "/admin/appointments/types", label: "Appointment Types" },
];

export function ApptTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
