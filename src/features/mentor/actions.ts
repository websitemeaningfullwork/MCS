"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { optionalHttpUrlSchema } from "@/lib/safe-url";

/**
 * Mentor self-service profile edit.
 *
 * This action is the one write path a non-admin can reach on the `mentors`
 * table — migration 005 grants every mentor UPDATE on their own row — and
 * everything it stores is rendered on the public /mentors/<id> page. It
 * previously ran with no schema at all, which meant:
 *  - `linkedin_url` went straight to a raw `<a href>`, so a mentor could store
 *    `javascript:…` and have it fire for every visitor to their profile;
 *  - `expertise` / `skills` were unbounded arrays, so one account could store
 *    an arbitrarily large payload that the public page then has to render; and
 *  - the free-text fields had no length limits at all.
 *
 * Everything is validated here rather than in the form, because the form is
 * just a convenience — the server action is callable directly.
 */

/** A single expertise/skill chip. Non-empty and short enough to render. */
const tagSchema = z.string().trim().min(1, "Remove the blank entry.").max(60);

const mentorProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  bio: z.string().trim().max(600, "Keep your bio to 600 characters or fewer."),
  headline: z.string().trim().max(160, "Keep your headline to 160 characters or fewer."),
  expertise: z.array(tagSchema).max(20, "List at most 20 areas of expertise."),
  skills: z.array(tagSchema).max(20, "List at most 20 skills."),
  whatsapp: z.string().trim().max(40, "That WhatsApp number looks too long."),
  linkedin_url: optionalHttpUrlSchema,
});

export type MentorProfileInput = z.input<typeof mentorProfileSchema>;

export async function updateOwnMentorProfile(
  input: MentorProfileInput,
): Promise<{ error?: string }> {
  const parsed = mentorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

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
      full_name: d.full_name,
      bio: d.bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (profileErr) return { error: "Could not save your profile." };

  const { error } = await supabase
    .from("mentors")
    .update({
      headline: d.headline || null,
      expertise: d.expertise,
      skills: d.skills,
      whatsapp: d.whatsapp || null,
      linkedin_url: d.linkedin_url || null,
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save your profile." };

  revalidatePath("/mentor/profile");
  revalidatePath(`/mentors/${user.id}`);
  return {};
}
