import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { MyAppointments, type MyAppointment } from "@/components/dashboard/my-appointments";
import { todayInDhaka } from "@/features/appointments/slots";

export const metadata: Metadata = { title: "My Appointments" };

export default async function DashboardAppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("appointments")
        .select(
          "id, appointment_date, start_time, end_time, duration, platform, meeting_link, amount_bdt, payment_status, status, details",
        )
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })
    : { data: [] };

  const appointments = (data ?? []) as MyAppointment[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Appointments</h1>
        <p className="mt-1 text-muted-foreground">
          Your booked mentoring sessions — upcoming, completed, and cancelled.
        </p>
      </header>
      <MyAppointments appointments={appointments} today={todayInDhaka()} />
    </div>
  );
}
