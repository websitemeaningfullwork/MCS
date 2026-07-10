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
    .select("id, order_id, user_id, status, paid_amount_bdt")
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

  // Guard against under-payment: the buyer-entered amount must at least cover the
  // order total. (Over-payment is fine.) There is no silent override, so a short
  // payment must be rejected and handled out-of-band with the buyer.
  if (Math.round(sub.paid_amount_bdt) < Math.round(order.total_bdt)) {
    return {
      error: `Paid amount (৳${sub.paid_amount_bdt}) is less than the order total (৳${order.total_bdt}) — do not approve; reject instead.`,
    };
  }

  // Grant access first. If any grant fails, abort BEFORE advancing the order or
  // submission status — otherwise the buyer would be marked "paid/approved" with
  // no access and no recovery path (re-approval short-circuits on "approved").
  for (const item of items ?? []) {
    if (!item.item_id) continue;
    if (item.item_type === "program") {
      const { error } = await admin
        .from("enrollments")
        .upsert(
          { user_id: sub.user_id, program_id: item.item_id },
          { onConflict: "user_id,program_id" },
        );
      if (error) {
        console.error("approvePayment: enrollment grant failed", error);
        return { error: "Could not grant program access — not approved. Please retry." };
      }
    } else if (item.item_type === "resource") {
      const { error } = await admin
        .from("resource_access")
        .upsert(
          { user_id: sub.user_id, resource_id: item.item_id, order_id: sub.order_id },
          { onConflict: "user_id,resource_id" },
        );
      if (error) {
        console.error("approvePayment: resource grant failed", error);
        return { error: "Could not grant resource access — not approved. Please retry." };
      }
    }
  }

  const { error: orderErr } = await admin
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", sub.order_id);
  if (orderErr) {
    console.error("approvePayment: order status update failed", orderErr);
    return { error: "Access was granted but the order status could not be updated. Please retry." };
  }

  const { error: subErr } = await admin
    .from("manual_payment_submissions")
    .update({
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (subErr) {
    console.error("approvePayment: submission status update failed", subErr);
    return { error: "Access was granted but the submission could not be finalized. Please retry." };
  }

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
    .select("id, order_id, user_id, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub || !sub.order_id || !sub.user_id) return { error: "Submission not found." };
  if (sub.status === "rejected") return {}; // idempotent

  // If this payment was previously approved, access has already been granted.
  // Rejecting it must REVOKE that access — otherwise the order shows "rejected"
  // while the buyer keeps everything they were given.
  if (sub.status === "approved") {
    const { data: items } = await admin
      .from("order_items")
      .select("item_type, item_id")
      .eq("order_id", sub.order_id);
    for (const item of items ?? []) {
      if (!item.item_id) continue;
      if (item.item_type === "program") {
        const { error } = await admin
          .from("enrollments")
          .delete()
          .eq("user_id", sub.user_id)
          .eq("program_id", item.item_id);
        if (error) {
          console.error("rejectPayment: enrollment revoke failed", error);
          return { error: "Could not revoke program access — not rejected. Please retry." };
        }
      } else if (item.item_type === "resource") {
        const { error } = await admin
          .from("resource_access")
          .delete()
          .eq("user_id", sub.user_id)
          .eq("resource_id", item.item_id);
        if (error) {
          console.error("rejectPayment: resource revoke failed", error);
          return { error: "Could not revoke resource access — not rejected. Please retry." };
        }
      }
    }
  }

  const { error: subErr } = await admin
    .from("manual_payment_submissions")
    .update({
      status: "rejected",
      admin_note: note || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (subErr) {
    console.error("rejectPayment: submission status update failed", subErr);
    return { error: "Could not update the submission. Please retry." };
  }

  const { error: orderErr } = await admin
    .from("orders")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", sub.order_id);
  if (orderErr) {
    console.error("rejectPayment: order status update failed", orderErr);
    return { error: "Could not update the order. Please retry." };
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${submissionId}`);
  return {};
}
