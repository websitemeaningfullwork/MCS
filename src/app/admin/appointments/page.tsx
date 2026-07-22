import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CalendarClock, Clock3, TrendingUp } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { ApptTabs } from "@/components/admin/appointments/appt-tabs";
import { AdminNotifications } from "@/components/admin/appointments/admin-notifications";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge,
} from "@/components/appointments/status-badge";
import { formatSlotLabel, todayInDhaka } from "@/features/appointments/slots";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Appointments — Admin" };

export default async function AdminAppointmentsDashboard() {
  const { supabase } = await requireAdmin();
  const today = todayInDhaka();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [totalRes, pendingRes, todayRes, paidRes, todayList, notifRes] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", today),
    supabase
      .from("appointments")
      .select("amount_bdt, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", monthStart),
    supabase
      .from("appointments")
      .select("id, start_time, end_time, duration, status, payment_status, amount_bdt, details")
      .eq("appointment_date", today)
      .order("start_time", { ascending: true }),
    supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .is("user_id", null)
      .eq("role", "admin")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const monthlyRevenue = (paidRes.data ?? []).reduce((sum, r) => sum + Number(r.amount_bdt), 0);

  const kpis = [
    {
      label: "Total Appointments",
      value: String(totalRes.count ?? 0),
      icon: CalendarCheck,
      tint: "text-primary",
    },
    {
      label: "Pending Confirmation",
      value: String(pendingRes.count ?? 0),
      icon: Clock3,
      tint: "text-warning",
    },
    {
      label: "Today's Appointments",
      value: String(todayRes.count ?? 0),
      icon: CalendarClock,
      tint: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Monthly Revenue",
      value: formatBDT(monthlyRevenue),
      icon: TrendingUp,
      tint: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
      </div>
      <ApptTabs />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className={`size-4 ${k.tint}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Today's appointments */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Today&apos;s Appointments</h2>
            <Link href="/admin/appointments/all" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          {(todayList.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No appointments scheduled for today.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Time</th>
                    <th className="pb-2 pr-3 font-medium">Customer</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(todayList.data ?? []).map((a) => {
                    const d = (a.details ?? {}) as Record<string, string>;
                    return (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap py-2.5 pr-3 text-foreground">
                          {formatSlotLabel(a.start_time)}
                        </td>
                        <td className="py-2.5 pr-3 text-foreground">{d.full_name ?? "—"}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{d.type_name ?? "—"}</td>
                        <td className="py-2.5 pr-3">
                          <AppointmentStatusBadge status={a.status} />
                        </td>
                        <td className="py-2.5">
                          <PaymentStatusBadge status={a.payment_status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Notifications */}
        <AdminNotifications notifications={notifRes.data ?? []} />
      </div>
    </div>
  );
}
