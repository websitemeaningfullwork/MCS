"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge,
} from "@/components/appointments/status-badge";
import {
  updateAppointmentStatus,
  updateAppointmentPayment,
  changeAppointmentMentor,
  adminRescheduleAppointment,
  setMeetingLink,
  deleteAppointment,
} from "@/features/appointments/admin-actions";
import {
  appointmentStatuses,
  paymentStatuses,
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/features/appointments/schema";
import { formatSlotLabel } from "@/features/appointments/slots";
import { formatBDT } from "@/lib/format";

export type AdminAppointment = {
  id: string;
  mentor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  status: string;
  payment_status: string;
  amount_bdt: number;
  platform: string;
  meeting_link: string | null;
  transaction_id: string | null;
  details: Record<string, string> | null;
};

export type MentorOption = { id: string; name: string };

export function AppointmentsTable({
  appointments,
  mentors,
}: {
  appointments: AdminAppointment[];
  mentors: MentorOption[];
}) {
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [payF, setPayF] = useState("all");

  const mentorName = useMemo(
    () => new Map(mentors.map((m) => [m.id, m.name])),
    [mentors],
  );

  const filtered = appointments.filter((a) => {
    if (statusF !== "all" && a.status !== statusF) return false;
    if (payF !== "all" && a.payment_status !== payF) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const d = a.details ?? {};
      const hay = `${d.full_name ?? ""} ${d.type_name ?? ""} ${mentorName.get(a.mentor_id) ?? ""} ${a.transaction_id ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, type, mentor or TrxID"
            className="pl-9"
          />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {appointmentStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {APPOINTMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={payF} onValueChange={setPayF}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {paymentStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {appointments.length} appointments
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3 font-medium">Date & Time</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Mentor</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 text-right font-medium">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a) => {
              const d = a.details ?? {};
              return (
                <tr key={a.id} className="align-top">
                  <td className="whitespace-nowrap p-3 text-foreground">
                    <div>{a.appointment_date}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatSlotLabel(a.start_time)}
                    </div>
                  </td>
                  <td className="p-3 text-foreground">{d.full_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{d.type_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">
                    {mentorName.get(a.mentor_id) ?? "—"}
                  </td>
                  <td className="whitespace-nowrap p-3 text-foreground">
                    {formatBDT(a.amount_bdt)}
                  </td>
                  <td className="p-3">
                    <AppointmentStatusBadge status={a.status} />
                  </td>
                  <td className="p-3">
                    <PaymentStatusBadge status={a.payment_status} />
                  </td>
                  <td className="p-3 text-right">
                    <ManageDialog appt={a} mentors={mentors} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No appointments match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageDialog({
  appt,
  mentors,
}: {
  appt: AdminAppointment;
  mentors: MentorOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();

  const [status, setStatus] = useState(appt.status);
  const [payment, setPayment] = useState(appt.payment_status);
  const [mentorId, setMentorId] = useState(appt.mentor_id);
  const [date, setDate] = useState(appt.appointment_date);
  const [time, setTime] = useState(appt.start_time);
  const [link, setLink] = useState(appt.meeting_link ?? "");
  const d = appt.details ?? {};

  function run(fn: () => Promise<{ error?: string }>, success: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings2 className="size-4" /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl bg-secondary/40 p-3 text-sm">
            <p className="font-medium text-foreground">{d.full_name ?? "Customer"}</p>
            <p className="text-muted-foreground">
              {d.type_name ?? "Session"} · {appt.appointment_date} · {formatSlotLabel(appt.start_time)}
            </p>
            {d.phone ? <p className="text-muted-foreground">Phone: {d.phone}</p> : null}
            {d.whatsapp ? <p className="text-muted-foreground">WhatsApp: {d.whatsapp}</p> : null}
            {appt.transaction_id ? (
              <p className="text-muted-foreground">TrxID: {appt.transaction_id}</p>
            ) : null}
            {d.note ? <p className="mt-1 text-muted-foreground">“{d.note}”</p> : null}
          </div>

          {/* Status */}
          <Row label="Booking status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPOINTMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={busy || status === appt.status}
              onClick={() =>
                run(
                  () => updateAppointmentStatus(appt.id, status as AppointmentStatus),
                  "Status updated.",
                )
              }
            >
              Save
            </Button>
          </Row>

          {/* Payment */}
          <Row label="Payment status">
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PAYMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={busy || payment === appt.payment_status}
              onClick={() =>
                run(
                  () => updateAppointmentPayment(appt.id, payment as PaymentStatus),
                  "Payment updated.",
                )
              }
            >
              Save
            </Button>
          </Row>

          {/* Mentor */}
          <Row label="Mentor">
            <Select value={mentorId} onValueChange={setMentorId}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mentors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={busy || mentorId === appt.mentor_id}
              onClick={() =>
                run(() => changeAppointmentMentor(appt.id, mentorId), "Mentor changed.")
              }
            >
              Save
            </Button>
          </Row>

          {/* Reschedule */}
          <div className="space-y-2">
            <Label>Reschedule</Label>
            <div className="flex items-center gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  run(
                    () => adminRescheduleAppointment(appt.id, date, time),
                    "Rescheduled.",
                  )
                }
              >
                Save
              </Button>
            </div>
          </div>

          {/* Meeting link */}
          <div className="space-y-2">
            <Label htmlFor="link">Meeting link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/…"
              />
              <Button
                size="sm"
                disabled={busy}
                onClick={() => run(() => setMeetingLink(appt.id, link), "Meeting link saved.")}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Delete */}
          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => {
                if (!confirm("Delete this appointment permanently?")) return;
                run(async () => {
                  const res = await deleteAppointment(appt.id);
                  if (!res.error) setOpen(false);
                  return res;
                }, "Appointment deleted.");
              }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
