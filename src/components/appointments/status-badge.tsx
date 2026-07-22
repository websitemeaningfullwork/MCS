import { cn } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/features/appointments/schema";

// Green stays status-only (confirmed / paid / completed / available).
const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  confirmed: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  rescheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  no_show: "bg-muted text-muted-foreground",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  unpaid: "bg-muted text-muted-foreground",
  submitted: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  paid: "bg-success/10 text-success",
  refunded: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  const key = (status as AppointmentStatus) in APPOINTMENT_STATUS_LABELS
    ? (status as AppointmentStatus)
    : "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[key],
      )}
    >
      {APPOINTMENT_STATUS_LABELS[key]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const key = (status as PaymentStatus) in PAYMENT_STATUS_LABELS
    ? (status as PaymentStatus)
    : "unpaid";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PAYMENT_STYLES[key],
      )}
    >
      {PAYMENT_STATUS_LABELS[key]}
    </span>
  );
}
