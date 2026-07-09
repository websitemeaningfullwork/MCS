"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Please enter your name."),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ error: string } | { success: true }> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const update: {
    full_name: string;
    bio: string | null;
    avatar_url?: string;
    updated_at: string;
  } = {
    full_name: parsed.data.full_name,
    bio: parsed.data.bio ?? null,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.avatar_url) update.avatar_url = parsed.data.avatar_url;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { error: "Could not save your changes. Please try again." };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
