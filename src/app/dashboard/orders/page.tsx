import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = { title: "My Orders" };

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_bdt, status, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        My Orders
      </h1>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your purchases and their status will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {formatBDT(order.total_bdt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
