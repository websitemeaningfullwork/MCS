import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Hash, User, Video } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/appointments/status-badge";
import { formatSlotLabel } from "@/features/appointments/slots";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Booking Confirmed" };

export default async function AppointmentConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/appointments/${id}/confirmation`);

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "id, user_id, appointment_date, start_time, amount_bdt, platform, payment_status, details",
    )
    .eq("id", id)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) notFound();

  const details = (appt.details ?? {}) as Record<string, string>;
  const shortId = appt.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-14 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Booking Successful</h1>
      <p className="mt-2 text-muted-foreground">
        Your session is reserved. We&apos;ll confirm as soon as your payment is verified.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-card p-5 text-left shadow-card sm:p-6">
        <dl className="divide-y divide-border">
          <Row icon={<Hash className="size-4" />} label="Appointment ID" value={`#${shortId}`} />
          <Row icon={<User className="size-4" />} label="Type" value={details.type_name ?? "Session"} />
          <Row
            icon={<CalendarDays className="size-4" />}
            label="Date & Time"
            value={`${appt.appointment_date}, ${formatSlotLabel(appt.start_time)}`}
          />
          <Row icon={<User className="size-4" />} label="Mentor" value={details.mentor_name ?? "MCA Mentor"} />
          <Row icon={<Video className="size-4" />} label="Platform" value={appt.platform} />
          <Row icon={<Clock className="size-4" />} label="Amount" value={formatBDT(appt.amount_bdt)} />
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Payment Status</span>
          <PaymentStatusBadge status={appt.payment_status} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/dashboard/appointments">View My Appointments</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/appointments">Book Another</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
