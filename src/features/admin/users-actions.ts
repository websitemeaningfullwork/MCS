"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

async function assertAdmin() {
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
  return profile?.role === "admin" ? supabase : null;
}

export async function setUserRole(
  userId: string,
  role: Enums<"user_role">,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "Could not change the role." };

  // Ensure a mentors row exists when promoting to mentor.
  if (role === "mentor") {
    await supabase.from("mentors").upsert({ id: userId }, { onConflict: "id" });
  }

  revalidatePath("/admin/users");
  revalidatePath("/mentors");
  return {};
}

export async function setMentorVerified(
  userId: string,
  verified: boolean,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  await supabase.from("mentors").upsert(
    { id: userId, is_verified: verified },
    { onConflict: "id" },
  );

  revalidatePath("/admin/users");
  return {};
}
