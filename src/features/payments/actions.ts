"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePriceBDT } from "@/lib/format";
import { rateLimitByIp } from "@/lib/rate-limit";
import { manualPaymentSchema, type ManualPaymentInput } from "./schemas";

type ItemInfo = { title: string; price: number } | null;

async function loadItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: "program" | "resource",
  id: string,
): Promise<ItemInfo> {
  if (type === "program") {
    const { data } = await supabase
      .from("programs")
      .select("title, price_bdt, discount_bdt, status")
      .eq("id", id)
      .maybeSingle();
    if (!data || data.status !== "published") return null;
    return { title: data.title, price: effectivePriceBDT(data.price_bdt, data.discount_bdt) };
  }
  const { data } = await supabase
    .from("public_resources")
    .select("title, price_bdt")
    .eq("id", id)
    .maybeSingle();
  if (!data || !data.title) return null;
  return { title: data.title, price: data.price_bdt ?? 0 };
}

export async function submitManualPayment(
  input: ManualPaymentInput,
): Promise<{ error: string }> {
  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const { type, id, sender_number, transaction_id, paid_amount_bdt, screenshot_path } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  // Limit repeated submissions from one user (payment-review noise / spam).
  if (!(await rateLimitByIp(`payment:${user.id}`, 5, 60_000))) {
    return { error: "Too many submissions. Please wait a minute and try again." };
  }

  const item = await loadItem(supabase, type, id);
  if (!item) return { error: "This item is not available." };
  if (item.price <= 0) return { error: "This item is free — no payment needed." };

  // Reject if the user already owns this item — avoids double payment and
  // duplicate review requests. RLS lets a user read their own access rows.
  if (type === "program") {
    const { data: owned } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", id)
      .maybeSingle();
    if (owned) return { error: "You already have access to this program." };
  } else {
    const { data: owned } = await supabase
      .from("resource_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", id)
      .maybeSingle();
    if (owned) return { error: "You already have access to this resource." };
  }

  // A screenshot path (optional) must live in the caller's own folder — never
  // trust an arbitrary client-supplied path pointing at another user's files.
  let safeScreenshotPath: string | null = null;
  if (screenshot_path) {
    if (!screenshot_path.startsWith(`${user.id}/`) || screenshot_path.includes("..")) {
      return { error: "Invalid screenshot reference." };
    }
    safeScreenshotPath = screenshot_path;
  }

  // Orders/items/submissions are created server-side with the service role so
  // clients cannot craft order rows or prices (RLS blocks student inserts).
  const admin = createAdminClient();

  // Confirm the referenced screenshot actually exists in the caller's folder
  // before trusting it. If it doesn't, drop it silently — it's optional, so a
  // stale/forged path must never block checkout nor be shown to an admin.
  if (safeScreenshotPath) {
    const slash = safeScreenshotPath.lastIndexOf("/");
    const folder = safeScreenshotPath.slice(0, slash);
    const name = safeScreenshotPath.slice(slash + 1);
    const { data: listed } = await admin.storage
      .from("payment-screenshots")
      .list(folder, { search: name, limit: 1 });
    if (!listed?.some((o) => o.name === name)) safeScreenshotPath = null;
  }

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({ user_id: user.id, total_bdt: item.price, status: "pending_verification" })
    .select("id")
    .single();
  if (orderErr || !order) {
    return { error: "Could not create your order. Please try again." };
  }

  const { error: itemErr } = await admin.from("order_items").insert({
    order_id: order.id,
    item_type: type,
    item_id: id,
    title: item.title,
    price_bdt: item.price,
  });
  if (itemErr) return { error: "Could not save your order. Please try again." };

  const { error: subErr } = await admin.from("manual_payment_submissions").insert({
    order_id: order.id,
    user_id: user.id,
    method: "bkash",
    sender_number,
    transaction_id,
    paid_amount_bdt,
    screenshot_path: safeScreenshotPath,
    status: "submitted",
  });
  if (subErr) return { error: "Could not submit your payment. Please try again." };

  redirect(`/dashboard/orders/${order.id}`);
}

/** Grant instant access to a FREE program/resource (server-verified as free). */
export async function enrollFree(
  type: "program" | "resource",
  id: string,
): Promise<{ error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const item = await loadItem(supabase, type, id);
  if (!item) return { error: "This item is not available." };
  if (item.price > 0) return { error: "This item is not free." };

  // Access grants bypass RLS (admin-only writes) — safe: server verified the item is free.
  const admin = createAdminClient();
  if (type === "program") {
    await admin
      .from("enrollments")
      .upsert({ user_id: user.id, program_id: id }, { onConflict: "user_id,program_id" });
    redirect("/dashboard/programs");
  } else {
    await admin
      .from("resource_access")
      .upsert({ user_id: user.id, resource_id: id }, { onConflict: "user_id,resource_id" });
    redirect("/dashboard/resources");
  }
  return { error: "" };
}
