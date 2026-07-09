import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, RotateCcw } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!order) notFound();

  const [{ data: items }, { data: submission }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase
      .from("manual_payment_submissions")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstItem = items?.[0];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Order details
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "pending_verification" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <Clock className="mt-0.5 size-5 text-warning" />
          <div>
            <p className="font-medium text-foreground">Waiting for approval</p>
            <p className="text-sm text-muted-foreground">
              We&apos;re verifying your payment. This usually takes up to 24
              hours.
            </p>
          </div>
        </div>
      ) : null}

      {order.status === "paid" ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
          <p className="font-medium text-foreground">Payment approved 🎉</p>
          <p className="text-sm text-muted-foreground">
            Your access has been unlocked. Find it in your dashboard.
          </p>
        </div>
      ) : null}

      {/* Items */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold text-foreground">Items</h2>
        </div>
        <ul className="divide-y divide-border">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {item.item_type}
                </p>
              </div>
              <span className="font-medium text-foreground">
                {formatBDT(item.price_bdt)}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between bg-secondary/40 p-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-semibold text-foreground">
              {formatBDT(order.total_bdt)}
            </span>
          </li>
        </ul>
      </div>

      {/* Submitted payment */}
      {submission ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Your payment details</h2>
          </div>
          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between p-4">
              <dt className="text-muted-foreground">Sender number</dt>
              <dd className="font-medium text-foreground">
                {submission.sender_number}
              </dd>
            </div>
            <div className="flex justify-between p-4">
              <dt className="text-muted-foreground">Transaction ID</dt>
              <dd className="font-medium text-foreground">
                {submission.transaction_id}
              </dd>
            </div>
            <div className="flex justify-between p-4">
              <dt className="text-muted-foreground">Amount paid</dt>
              <dd className="font-medium text-foreground">
                {formatBDT(submission.paid_amount_bdt)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {/* Rejected → show note + resubmit */}
      {order.status === "rejected" ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
          <p className="font-medium text-foreground">Payment rejected</p>
          {submission?.admin_note ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Reason: {submission.admin_note}
            </p>
          ) : null}
          {firstItem?.item_type && firstItem.item_id ? (
            <Button asChild className="mt-4 rounded-full">
              <Link
                href={`/checkout?type=${firstItem.item_type}&id=${firstItem.item_id}`}
              >
                <RotateCcw className="size-4" />
                Resubmit payment
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
