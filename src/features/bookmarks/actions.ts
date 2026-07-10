"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  itemType: z.enum(["program", "resource"]),
  itemId: z.string().uuid(),
});

export type BookmarkItemType = z.infer<typeof schema>["itemType"];

/**
 * Toggle a bookmark for the current user. Returns the new state. RLS
 * ("bookmarks: own") restricts rows to the caller.
 */
export async function toggleBookmark(
  itemType: BookmarkItemType,
  itemId: string,
): Promise<{ error: string } | { bookmarked: boolean }> {
  const parsed = schema.safeParse({ itemType, itemId });
  if (!parsed.success) return { error: "Invalid bookmark." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to save items." };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    if (error) return { error: "Could not remove the bookmark." };
    revalidatePath("/dashboard/bookmarks");
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
  if (error) return { error: "Could not save the bookmark." };
  revalidatePath("/dashboard/bookmarks");
  return { bookmarked: true };
}
