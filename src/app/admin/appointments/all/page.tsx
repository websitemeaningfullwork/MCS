import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin-guard";
import { ApptTabs } from "@/components/admin/appointments/appt-tabs";
import {
  AppointmentsTable,
  type AdminAppointment,
  type MentorOption,
} from "@/components/admin/appointments/appointments-table";

export const metadata: Metadata = { title: "All Appointments — Admin" };

export default async function AdminAllAppointmentsPage() {
  const { supabase } = await requireAdmin();

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, mentor_id, appointment_date, start_time, end_time, duration, status, payment_status, amount_bdt, platform, meeting_link, transaction_id, details",
    )
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  const { data: mentorProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "mentor")
    .order("full_name", { ascending: true });

  const mentors: MentorOption[] = (mentorProfiles ?? []).map((m) => ({
    id: m.id,
    name: m.full_name ?? "Mentor",
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
      <ApptTabs />
      <AppointmentsTable
        appointments={(appts ?? []) as AdminAppointment[]}
        mentors={mentors}
      />
    </div>
  );
}
