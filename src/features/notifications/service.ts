import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/types/database.types";

type NotificationRow = TablesInsert<"notifications">;

/**
 * Fan out in-app notifications with the service role (bypasses RLS). Best-effort:
 * a notification failure must never break the action that triggered it, so we
 * log and swallow. Chunk 9 wires the navbar bell; the admin dashboard already
 * reads these for its "Real-time Notifications" panel.
 */
export async function notify(rows: NotificationRow[]): Promise<void> {
  if (!rows.length) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(rows);
    if (error) console.error("notify: insert failed", error);
  } catch (err) {
    console.error("notify: threw", err);
  }
}

/** Convenience: broadcast a single row to all admins (user_id null, role admin). */
export function adminNotification(
  type: string,
  title: string,
  body: string,
  payload: Json = {},
): NotificationRow {
  return { user_id: null, role: "admin", type, title, body, payload };
}
