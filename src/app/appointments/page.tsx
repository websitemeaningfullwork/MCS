import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BookingWizard, type WizardType } from "@/components/appointments/booking-wizard";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book a one-on-one mentoring session with an MCA mentor.",
};

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/appointments");

  const [{ data: types }, { data: profile }] = await Promise.all([
    supabase
      .from("appointment_types")
      .select("id, name, description, icon, default_price_bdt, default_duration")
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
  ]);

  if (!types || types.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="mt-3 text-muted-foreground">
          Booking is being set up. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <BookingWizard
      types={types as WizardType[]}
      initialProfile={{
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
      }}
    />
  );
}
