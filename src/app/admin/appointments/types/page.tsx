import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin-guard";
import { ApptTabs } from "@/components/admin/appointments/appt-tabs";
import { TypesManager, type ApptType } from "@/components/admin/appointments/types-manager";

export const metadata: Metadata = { title: "Appointment Types — Admin" };

export default async function AdminAppointmentTypesPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("appointment_types")
    .select("id, name, description, icon, default_price_bdt, default_duration, status, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
      <ApptTabs />
      <TypesManager types={(data ?? []) as ApptType[]} />
    </div>
  );
}
