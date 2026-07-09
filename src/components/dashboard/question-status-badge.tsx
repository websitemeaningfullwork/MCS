import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; className: string }> = {
  waiting: {
    label: "Waiting",
    className: "border-warning/30 bg-warning/15 text-warning",
  },
  answered: {
    label: "Answered",
    className: "border-success/30 bg-success/15 text-success",
  },
  closed: {
    label: "Closed",
    className: "border-border bg-secondary text-muted-foreground",
  },
};

export function QuestionStatusBadge({ status }: { status: string | null }) {
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
