import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; className: string }> = {
  pending_payment: {
    label: "Pending payment",
    className: "border-border bg-secondary text-muted-foreground",
  },
  pending_verification: {
    label: "Pending verification",
    className: "border-warning/30 bg-warning/15 text-warning",
  },
  paid: {
    label: "Paid",
    className: "border-success/30 bg-success/15 text-success",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/30 bg-destructive/15 text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-border bg-secondary text-muted-foreground",
  },
};

export function OrderStatusBadge({ status }: { status: string | null }) {
  const s = MAP[status ?? ""] ?? {
    label: status ?? "Unknown",
    className: "border-border bg-secondary text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}
