import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  User,
  Video,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { CopyNumberButton } from "@/components/checkout/copy-number-button";
import { AppointmentPaymentForm } from "@/components/appointments/appointment-payment-form";
import { formatSlotLabel } from "@/features/appointments/slots";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Complete Payment" };

export default async function AppointmentPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/appointments/${id}/pay`);

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      "id, user_id, appointment_date, start_time, amount_bdt, payment_status, platform, details",
    )
    .eq("id", id)
    .maybeSingle();
  if (!appt || appt.user_id !== user.id) notFound();

  // Already paid / awaiting verification → go straight to the confirmation.
  if (appt.payment_status !== "unpaid") redirect(`/appointments/${id}/confirmation`);

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const details = (appt.details ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Complete Your <span className="text-success">Payment</span>
        </h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5 text-success" /> Secure manual verification
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Summary */}
        <section className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
            <h2 className="font-semibold text-foreground">Appointment Summary</h2>
            <dl className="mt-4 divide-y divide-border">
              <Row icon={<User className="size-4" />} label="Type" value={details.type_name ?? "Session"} />
              <Row icon={<CalendarDays className="size-4" />} label="Date" value={appt.appointment_date} />
              <Row icon={<Clock className="size-4" />} label="Time" value={formatSlotLabel(appt.start_time)} />
              <Row icon={<User className="size-4" />} label="Mentor" value={details.mentor_name ?? "MCA Mentor"} />
              <Row icon={<Video className="size-4" />} label="Platform" value={appt.platform} />
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-medium text-foreground">Total</span>
              <span className="text-3xl font-bold tracking-tight text-primary">
                {formatBDT(appt.amount_bdt)}
              </span>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-pink-500/20 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border bg-pink-500/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#e2136e]/10 text-[#e2136e]">
                  <Smartphone className="size-5" />
                </span>
                <h2 className="font-semibold text-foreground">Payment Method</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <ShieldCheck className="size-3.5" /> Secure
              </span>
            </div>
            {settings ? (
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#e2136e] px-2 py-0.5 text-xs font-bold text-white">
                    bKash
                  </span>
                  <span className="text-sm text-muted-foreground">Send Money</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Number</p>
                    <p className="mt-1 text-2xl font-bold tracking-wide text-foreground">
                      {settings.bkash_number}
                    </p>
                    <div className="mt-3">
                      <CopyNumberButton value={settings.bkash_number} />
                    </div>
                  </div>
                  <div className="flex size-20 items-center justify-center rounded-2xl border border-pink-500/20 bg-white text-[#e2136e]">
                    <QrCode className="size-12" />
                  </div>
                </div>
                {settings.instructions ? (
                  <p className="mt-4 rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                    {settings.instructions}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="p-5 text-sm text-muted-foreground">
                Payment details are being configured. Please contact support.
              </div>
            )}
          </div>

          {settings ? (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
              <h2 className="font-semibold text-foreground">Verify Your Payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                After sending money, submit the details below.
              </p>
              <div className="mt-5">
                <AppointmentPaymentForm
                  appointmentId={appt.id}
                  amount={appt.amount_bdt}
                  userId={user.id}
                />
              </div>
            </div>
          ) : null}
        </section>
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
