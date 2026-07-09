"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateOwnMentorProfile(input: {
  full_name: string;
  bio: string;
  headline: string;
  expertise: string[];
  skills: string[];
  whatsapp: string;
  linkedin_url: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "mentor" && profile.role !== "admin")) {
    return { error: "Not authorized." };
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      bio: input.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (profileErr) return { error: "Could not save your profile." };

  const { error } = await supabase
    .from("mentors")
    .update({
      headline: input.headline || null,
      expertise: input.expertise,
      skills: input.skills,
      whatsapp: input.whatsapp || null,
      linkedin_url: input.linkedin_url || null,
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save your profile." };

  revalidatePath("/mentor/profile");
  revalidatePath(`/mentors/${user.id}`);
  return {};
}
