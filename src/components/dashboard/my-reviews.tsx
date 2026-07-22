"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stars } from "@/components/reviews/stars";
import { StarInput } from "@/components/reviews/star-input";
import { updateOwnReview, deleteOwnReview } from "@/features/reviews/actions";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MyReviewRow = {
  id: string;
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

export function MyReviews({ rows }: { rows: MyReviewRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(row: MyReviewRow) {
    setEditingId(row.id);
    setRating(row.rating);
    setBody(row.body);
  }

  function save(id: string) {
    if (rating < 1) {
      toast.error("Pick a star rating.");
      return;
    }
    startTransition(async () => {
      const res = await updateOwnReview({ reviewId: id, rating, body: body.trim() || null });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Review updated — pending re-approval.");
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      const res = await deleteOwnReview(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Review deleted.");
      router.refresh();
    });
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const editing = editingId === r.id;
        return (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{r.programTitle}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {r.scope} · {r.target}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  STATUS_STYLE[r.status] ?? "bg-secondary text-muted-foreground",
                )}
              >
                {r.status}
              </span>
            </div>

            {editing ? (
              <div className="mt-4 space-y-3">
                <StarInput value={rating} onChange={setRating} disabled={pending} size="md" />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="Update your review (optional)…"
                  disabled={pending}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save(r.id)} disabled={pending}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    disabled={pending}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <Stars rating={r.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                </div>
                {r.body ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(r.id)}
                    disabled={pending}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
