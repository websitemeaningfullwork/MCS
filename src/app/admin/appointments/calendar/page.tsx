import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ApptTabs } from "@/components/admin/appointments/appt-tabs";
import { todayInDhaka } from "@/features/appointments/slots";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendar — Admin" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthParam(m: string | undefined): { year: number; month: number } {
  const today = todayInDhaka();
  const raw = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  return { year: Number(raw.slice(0, 4)), month: Number(raw.slice(5, 7)) - 1 };
}

function fmt(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { month: monthQ } = await searchParams;
  const { year, month } = monthParam(monthQ);

  const first = `${fmt(year, month)}-01`;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const last = `${fmt(year, month)}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: appts } = await supabase
    .from("appointments")
    .select("appointment_date, status")
    .gte("appointment_date", first)
    .lte("appointment_date", last)
    .neq("status", "cancelled");

  // date -> count
  const counts = new Map<string, number>();
  for (const a of appts ?? []) {
    counts.set(a.appointment_date, (counts.get(a.appointment_date) ?? 0) + 1);
  }

  const startDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayInDhaka();

  const prev = month === 0 ? fmt(year - 1, 11) : fmt(year, month - 1);
  const next = month === 11 ? fmt(year + 1, 0) : fmt(year, month + 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
      <ApptTabs />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <Link
            href={`/admin/appointments/calendar?month=${prev}`}
            className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <h2 className="font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <Link
            href={`/admin/appointments/calendar?month=${next}`}
            className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEK.map((w) => (
            <span key={w} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} />;
            const dateISO = `${fmt(year, month)}-${String(d).padStart(2, "0")}`;
            const count = counts.get(dateISO) ?? 0;
            const isToday = dateISO === today;
            return (
              <div
                key={dateISO}
                className={cn(
                  "flex min-h-16 flex-col rounded-lg border p-1.5 text-sm",
                  isToday ? "border-primary" : "border-border",
                )}
              >
                <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                  {d}
                </span>
                {count > 0 ? (
                  <span className="mt-auto inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {count} booked
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
