"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Loader2,
  User,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/marketing/empty-state";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge,
} from "@/components/appointments/status-badge";
import {
  cancelAppointment,
  rescheduleAppointment,
  getRescheduleSlots,
  type DaySlot,
} from "@/features/appointments/actions";
import { formatSlotLabel } from "@/features/appointments/slots";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MyAppointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  platform: string;
  meeting_link: string | null;
  amount_bdt: number;
  payment_status: string;
  status: string;
  details: Record<string, string> | null;
};

export function MyAppointments({
  appointments,
  today,
}: {
  appointments: MyAppointment[];
  today: string;
}) {
  const upcoming = appointments.filter(
    (a) => a.appointment_date >= today && !["cancelled", "completed"].includes(a.status),
  );
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        <List items={upcoming} today={today} emptyLabel="No upcoming appointments." />
      </TabsContent>
      <TabsContent value="completed" className="mt-4">
        <List items={completed} today={today} emptyLabel="No completed appointments yet." />
      </TabsContent>
      <TabsContent value="cancelled" className="mt-4">
        <List items={cancelled} today={today} emptyLabel="No cancelled appointments." />
      </TabsContent>
    </Tabs>
  );
}

function List({
  items,
  today,
  emptyLabel,
}: {
  items: MyAppointment[];
  today: string;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          title={emptyLabel}
          description="Book a one-on-one mentoring session to see it here."
        />
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/appointments">Book an appointment</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <AppointmentCard key={a.id} appt={a} today={today} />
      ))}
    </div>
  );
}

function AppointmentCard({ appt, today }: { appt: MyAppointment; today: string }) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const details = appt.details ?? {};
  const isUpcoming =
    appt.appointment_date >= today && !["cancelled", "completed"].includes(appt.status);
  const canCancel = isUpcoming;
  const needsPayment = appt.payment_status === "unpaid";

  function doCancel() {
    if (!confirm("Cancel this appointment? This cannot be undone.")) return;
    startBusy(async () => {
      const res = await cancelAppointment(appt.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Appointment cancelled.");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{details.type_name ?? "Session"}</h3>
            <AppointmentStatusBadge status={appt.status} />
            <PaymentStatusBadge status={appt.payment_status} />
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            <Meta icon={<CalendarDays className="size-4" />} value={appt.appointment_date} />
            <Meta
              icon={<Clock className="size-4" />}
              value={`${formatSlotLabel(appt.start_time)}${appt.end_time ? ` – ${formatSlotLabel(appt.end_time)}` : ""}`}
            />
            <Meta icon={<User className="size-4" />} value={details.mentor_name ?? "MCA Mentor"} />
            <Meta icon={<Video className="size-4" />} value={appt.platform} />
          </dl>
        </div>
        <span className="text-lg font-bold text-primary">{formatBDT(appt.amount_bdt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {needsPayment ? (
          <Button asChild size="sm">
            <Link href={`/appointments/${appt.id}/pay`}>Complete Payment</Link>
          </Button>
        ) : null}
        {appt.status === "confirmed" && appt.meeting_link ? (
          <Button asChild size="sm" variant="outline">
            <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer">
              <Video className="size-4" /> Join Meeting
            </a>
          </Button>
        ) : null}
        {canCancel ? (
          <RescheduleDialog appt={appt} today={today} onDone={() => router.refresh()} />
        ) : null}
        {canCancel ? (
          <Button size="sm" variant="ghost" onClick={doCancel} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Meta({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function RescheduleDialog({
  appt,
  today,
  onDone,
}: {
  appt: MyAppointment;
  today: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(appt.appointment_date);
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [saving, startSave] = useTransition();

  function loadSlots(d: string) {
    setDate(d);
    setTime(null);
    startLoad(async () => {
      const res = await getRescheduleSlots(appt.id, d);
      if (res.error) toast.error(res.error);
      setSlots(res.slots);
    });
  }

  function save() {
    if (!time) return;
    startSave(async () => {
      const res = await rescheduleAppointment(appt.id, date, time);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Appointment rescheduled.");
        setOpen(false);
        onDone();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) loadSlots(appt.appointment_date);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarClock className="size-4" /> Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resched-date">New date</Label>
            <Input
              id="resched-date"
              type="date"
              min={today}
              value={date}
              onChange={(e) => loadSlots(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Available times</Label>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : slots.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No free slots that day. Try another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => {
                  const disabled = s.status === "booked";
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTime(s.time)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                        disabled
                          ? "cursor-not-allowed border-destructive/30 bg-destructive/5 text-destructive/60 line-through"
                          : time === s.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-secondary",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Button onClick={save} disabled={!time || saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirm new time
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
