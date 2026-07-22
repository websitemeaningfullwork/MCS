"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Mark one notification read (RLS scopes it to the caller / admin broadcasts). */
export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) return { error: "Could not update the notification." };
  revalidatePath("/admin/appointments");
  return {};
}

/**
 * Mark every notification the caller can see as read. `scope: "admin"` targets
 * the admin broadcast feed; otherwise the caller's personal feed.
 */
export async function markAllNotificationsRead(
  scope: "admin" | "personal" = "personal",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const query = supabase.from("notifications").update({ read: true }).eq("read", false);
  const { error } =
    scope === "admin"
      ? await query.is("user_id", null).eq("role", "admin")
      : await query.eq("user_id", user.id);
  if (error) return { error: "Could not update notifications." };

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return {};
}
