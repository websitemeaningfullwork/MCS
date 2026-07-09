import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmissionStatusBadge } from "@/components/admin/submission-status-badge";
import { ApproveRejectButtons } from "@/components/admin/approve-reject-buttons";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Review payment" };

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: sub } = await supabase
    .from("manual_payment_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sub) notFound();

  const [{ data: order }, { data: items }, { data: profile }] = await Promise.all([
    sub.order_id
      ? supabase.from("orders").select("*").eq("id", sub.order_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sub.order_id
      ? supabase.from("order_items").select("*").eq("order_id", sub.order_id)
      : Promise.resolve({ data: [] }),
    sub.user_id
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", sub.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Signed URL for the private screenshot (admin only).
  let screenshotUrl: string | null = null;
  if (sub.screenshot_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("payment-screenshots")
      .createSignedUrl(sub.screenshot_path, 60 * 10);
    screenshotUrl = signed?.signedUrl ?? null;
  }

  const decided = sub.status !== "submitted";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/payments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to payments
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Review payment
        </h1>
        <SubmissionStatusBadge status={sub.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submission details */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Student</h2>
            </div>
            <div className="p-4">
              <p className="font-medium text-foreground">
                {profile?.full_name ?? "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">{profile?.email ?? ""}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Payment claim</h2>
            </div>
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between p-4">
                <dt className="text-muted-foreground">Sender number</dt>
                <dd className="font-medium text-foreground">{sub.sender_number}</dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="font-medium text-foreground">
                  {sub.transaction_id}
                </dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-muted-foreground">Amount paid</dt>
                <dd className="font-medium text-foreground">
                  {formatBDT(sub.paid_amount_bdt)}
                </dd>
              </div>
              <div className="flex justify-between p-4">
                <dt className="text-muted-foreground">Order total</dt>
                <dd className="font-medium text-foreground">
                  {order ? formatBDT(order.total_bdt) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Items to unlock</h2>
            </div>
            <ul className="divide-y divide-border">
              {(items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between p-4 text-sm">
                  <span className="text-foreground">{item.title}</span>
                  <span className="capitalize text-muted-foreground">
                    {item.item_type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Screenshot + actions */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold text-foreground">Screenshot</h2>
            </div>
            <div className="p-4">
              {screenshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotUrl}
                  alt="Payment screenshot"
                  className="w-full rounded-lg border border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No screenshot was uploaded.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold text-foreground">Decision</h2>
            {sub.admin_note ? (
              <p className="mb-4 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                Note: {sub.admin_note}
              </p>
            ) : null}
            <ApproveRejectButtons submissionId={sub.id} decided={decided} />
          </div>
        </div>
      </div>
    </div>
  );
}
