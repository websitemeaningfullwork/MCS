"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Download, EyeOff, Loader2, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Stars } from "@/components/reviews/stars";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { setReviewStatus, deleteReview } from "@/features/reviews/actions";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AdminReviewRow = {
  id: string;
  reviewerName: string;
  reviewerEmail: string;
  programTitle: string;
  target: string;
  scope: string;
  rating: number;
  body: string;
  status: string;
  createdAt: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-success/15 text-success",
  pending: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  hidden: "bg-secondary text-muted-foreground",
  reported: "bg-destructive/15 text-destructive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLE[status] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function toCsv(rows: AdminReviewRow[]): string {
  const header = ["Reviewer", "Email", "Program", "Target", "Scope", "Rating", "Status", "Date", "Review"];
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.reviewerName,
      r.reviewerEmail,
      r.programTitle,
      r.target,
      r.scope,
      String(r.rating),
      r.status,
      r.createdAt ?? "",
      r.body,
    ]
      .map(esc)
      .join(","),
  );
  return [header.map(esc).join(","), ...lines].join("\n");
}

export function ReviewsTable({ rows }: { rows: AdminReviewRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.reviewerName, r.reviewerEmail, r.programTitle, r.target, r.body]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  function runAction(id: string, fn: () => Promise<{ error?: string }>, ok: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(ok);
      router.refresh();
    });
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mca-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviewer, program, or text…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Program / Target</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="min-w-[220px]">Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const busy = pending && busyId === r.id;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{r.reviewerName}</p>
                    <p className="text-xs text-muted-foreground">{r.reviewerEmail}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{r.programTitle}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {r.scope} · {r.target}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Stars rating={r.rating} size="sm" />
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-3 max-w-sm text-sm text-muted-foreground">
                      {r.body || <span className="italic">No text</span>}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {r.status !== "approved" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Approve"
                          aria-label={`Approve review by ${r.reviewerName}`}
                          disabled={busy}
                          onClick={() =>
                            runAction(r.id, () => setReviewStatus(r.id, "approved"), "Review approved")
                          }
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4 text-success" />
                          )}
                        </Button>
                      ) : null}
                      {r.status !== "hidden" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hide"
                          aria-label={`Hide review by ${r.reviewerName}`}
                          disabled={busy}
                          onClick={() =>
                            runAction(r.id, () => setReviewStatus(r.id, "hidden"), "Review hidden")
                          }
                        >
                          <EyeOff className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        aria-label={`Delete review by ${r.reviewerName}`}
                        disabled={busy}
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete this review?",
                            description: `The review by ${r.reviewerName} will be permanently deleted. This cannot be undone.`,
                            confirmLabel: "Delete review",
                          });
                          if (!ok) return;
                          runAction(r.id, () => deleteReview(r.id), "Review deleted");
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} reviews.
      </p>

      {confirmDialog}
    </div>
  );
}
