"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailEnabled, escapeHtml } from "@/lib/email";
import { absoluteUrl } from "@/lib/site-url";

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

export async function createMentor(input: {
  email: string;
  full_name: string;
}): Promise<{ error?: string }> {
  const schema = z.object({
    email: z.string().email("Enter a valid email."),
    full_name: z.string().min(2, "Enter a name."),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const gate = await assertAdmin();
  if (!gate) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: randomBytes(16).toString("base64url"),
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (error || !created.user) {
    return { error: error?.message ?? "Could not create the mentor account." };
  }
  const userId = created.user.id;

  await admin
    .from("profiles")
    .update({ role: "mentor", full_name: parsed.data.full_name })
    .eq("id", userId);
  await admin.from("mentors").upsert({ id: userId }, { onConflict: "id" });

  // Best-effort invite: generate a recovery link so the mentor can set their own
  // password, and email it via Resend. If email isn't configured, the admin can
  // still tell them to use "Forgot password". Never block mentor creation on it.
  if (emailEnabled()) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: parsed.data.email,
      options: { redirectTo: absoluteUrl("/auth/callback?next=/reset-password") },
    });
    const actionLink = link?.properties?.action_link;
    if (actionLink) {
      void sendEmail({
        to: parsed.data.email,
        subject: "You've been added as a mentor on Meaningful Career Academy",
        html:
          `<p>Hi ${escapeHtml(parsed.data.full_name)},</p>` +
          `<p>An admin has set up a mentor account for you on Meaningful Career ` +
          `Academy. Click below to set your password and sign in:</p>` +
          `<p><a href="${actionLink}">Set your password</a></p>` +
          `<p>If you didn't expect this, you can ignore this email.</p>`,
      });
    }
  }

  revalidatePath("/admin/mentors");
  redirect(`/admin/mentors/${userId}/edit`);
}

export async function saveMentor(input: {
  id: string;
  full_name: string;
  bio: string;
  headline: string;
  expertise: string[];
  skills: string[];
  years_experience: number;
  whatsapp: string;
  linkedin_url: string;
  is_featured: boolean;
  is_verified: boolean;
}): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  await supabase
    .from("profiles")
    .update({ full_name: input.full_name, bio: input.bio || null })
    .eq("id", input.id);

  const { error } = await supabase
    .from("mentors")
    .update({
      headline: input.headline || null,
      expertise: input.expertise,
      skills: input.skills,
      years_experience: input.years_experience || null,
      whatsapp: input.whatsapp || null,
      linkedin_url: input.linkedin_url || null,
      is_featured: input.is_featured,
      is_verified: input.is_verified,
    })
    .eq("id", input.id);
  if (error) return { error: "Could not save the mentor." };

  revalidatePath("/admin/mentors");
  revalidatePath(`/mentors/${input.id}`);
  return {};
}

export async function deleteMentor(id: string): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("mentors").delete().eq("id", id);
  if (error) {
    console.error("deleteMentor: delete failed", error);
    return {
      error:
        "Could not remove this mentor — they may still be linked to programs, " +
        "questions, or live classes. Reassign those first.",
    };
  }
  const { error: roleErr } = await supabase
    .from("profiles")
    .update({ role: "student" })
    .eq("id", id);
  if (roleErr) {
    console.error("deleteMentor: role reset failed", roleErr);
    return { error: "Mentor removed, but their role could not be reset. Please retry." };
  }
  revalidatePath("/admin/mentors");
  return {};
}
