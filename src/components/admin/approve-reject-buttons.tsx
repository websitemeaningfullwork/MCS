"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approvePayment, rejectPayment } from "@/features/payments/admin-actions";

export function ApproveRejectButtons({
  submissionId,
  decided,
}: {
  submissionId: string;
  decided: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  async function handleApprove() {
    setLoading("approve");
    const res = await approvePayment(submissionId);
    if (res.error) {
      toast.error(res.error);
      setLoading(null);
      return;
    }
    toast.success("Payment approved — access granted.");
    router.refresh();
  }

  async function handleReject() {
    setLoading("reject");
    const res = await rejectPayment(submissionId, note.trim());
    if (res.error) {
      toast.error(res.error);
      setLoading(null);
      return;
    }
    toast.success("Payment rejected.");
    router.refresh();
  }

  if (decided) {
    return (
      <p className="text-sm text-muted-foreground">
        This request has already been reviewed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleApprove} disabled={loading !== null}>
          {loading === "approve" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Approve &amp; grant access
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowReject((s) => !s)}
          disabled={loading !== null}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
          Reject
        </Button>
      </div>

      {showReject ? (
        <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (shown to the student)…"
          />
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading !== null}
          >
            {loading === "reject" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Confirm rejection
          </Button>
        </div>
      ) : null}
    </div>
  );
}
