"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePriceBDT } from "@/lib/format";

/** Returns the admin's user id, or null if the caller is not an admin. */
async function getAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? user.id : null;
}

export async function approvePayment(
  submissionId: string,
): Promise<{ error?: string }> {
  const adminId = await getAdminId();
  if (!adminId) return { error: "Not authorized." };

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("manual_payment_submissions")
    .select("id, order_id, user_id, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub || !sub.order_id || !sub.user_id) return { error: "Submission not found." };
  if (sub.status === "approved") return {}; // idempotent

  const { data: order } = await admin
    .from("orders")
    .select("id, total_bdt, status")
    .eq("id", sub.order_id)
    .maybeSingle();
  if (!order) return { error: "Order not found." };

  // Grant access for each item in the order.
  const { data: items } = await admin
    .from("order_items")
    .select("item_type, item_id")
    .eq("order_id", sub.order_id);

  // Recompute the trusted total from source tables — never trust the stored
  // order/item prices, which could have been tampered with at insert time.
  let trustedTotal = 0;
  for (const item of items ?? []) {
    if (!item.item_id) continue;
    if (item.item_type === "program") {
      const { data: p } = await admin
        .from("programs")
        .select("price_bdt, discount_bdt, status")
        .eq("id", item.item_id)
        .maybeSingle();
      if (!p || p.status !== "published") {
        return { error: "Order contains an unavailable program — rejected." };
      }
      trustedTotal += effectivePriceBDT(p.price_bdt, p.discount_bdt);
    } else if (item.item_type === "resource") {
      const { data: r } = await admin
        .from("resources")
        .select("price_bdt, status")
        .eq("id", item.item_id)
        .maybeSingle();
      if (!r || r.status !== "published") {
        return { error: "Order contains an unavailable resource — rejected." };
      }
      trustedTotal += r.price_bdt ?? 0;
    }
  }

  if (Math.round(trustedTotal) !== Math.round(order.total_bdt)) {
    return {
      error: "Order total does not match current prices — do not approve; reject instead.",
    };
  }

  for (const item of items ?? []) {
    if (!item.item_id) continue;
    if (item.item_type === "program") {
      await admin
        .from("enrollments")
        .upsert(
          { user_id: sub.user_id, program_id: item.item_id },
          { onConflict: "user_id,program_id" },
        );
    } else if (item.item_type === "resource") {
      await admin
        .from("resource_access")
        .upsert(
          { user_id: sub.user_id, resource_id: item.item_id, order_id: sub.order_id },
          { onConflict: "user_id,resource_id" },
        );
    }
  }

  await admin
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", sub.order_id);

  await admin
    .from("manual_payment_submissions")
    .update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${submissionId}`);
  return {};
}

export async function rejectPayment(
  submissionId: string,
  note: string,
): Promise<{ error?: string }> {
  const adminId = await getAdminId();
  if (!adminId) return { error: "Not authorized." };

  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("manual_payment_submissions")
    .select("id, order_id, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub || !sub.order_id) return { error: "Submission not found." };

  await admin
    .from("manual_payment_submissions")
    .update({
      status: "rejected",
      admin_note: note || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  await admin
    .from("orders")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", sub.order_id);

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${submissionId}`);
  return {};
}
