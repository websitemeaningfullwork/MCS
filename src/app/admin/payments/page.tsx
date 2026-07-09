import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin-guard";
import { SubmissionStatusBadge } from "@/components/admin/submission-status-badge";
import { EmptyState } from "@/components/marketing/empty-state";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database.types";

export const metadata: Metadata = { title: "Payment Requests" };

const FILTERS: { value: string; label: string }[] = [
  { value: "submitted", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status } = await searchParams;
  const active = status ?? "submitted";

  let query = supabase
    .from("manual_payment_submissions")
    .select("id, user_id, sender_number, transaction_id, paid_amount_bdt, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (active !== "all") {
    query = query.eq("status", active as Enums<"submission_status">);
  }
  const { data: subs } = await query;
  const submissions = subs ?? [];

  const userIds = [
    ...new Set(submissions.map((s) => s.user_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Payment Requests
      </h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/payments?status=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No payment requests"
          description="Requests will appear here when students submit payments."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">TrxID</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((s) => {
                const profile = s.user_id ? profileById.get(s.user_id) : null;
                return (
                  <tr key={s.id} className="hover:bg-secondary/40">
                    <td className="p-4">
                      <p className="font-medium text-foreground">
                        {profile?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.email ?? ""}
                      </p>
                    </td>
                    <td className="p-4 text-foreground">
                      {formatBDT(s.paid_amount_bdt)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {s.transaction_id}
                    </td>
                    <td className="p-4">
                      <SubmissionStatusBadge status={s.status} />
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/payments/${s.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
