"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { optionalHttpUrlSchema } from "@/lib/safe-url";

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

/**
 * The form posts `starts_at` as a `datetime-local` value, but the action is
 * callable directly, so the string is validated — not merely non-empty — before
 * it reaches `new Date(...).toISOString()`. `new Date("not a date")` yields an
 * Invalid Date whose `.toISOString()` throws a RangeError, which surfaces as an
 * unhandled server-action exception (a 500 and a blank error toast) instead of
 * a form error. Validating and converting inside the schema means the action
 * body can never see an unparseable value.
 */
const startsAtSchema = z
  .string()
  .min(1, "Pick a date and time.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Pick a valid date and time.",
  })
  .transform((value) => new Date(value).toISOString());

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  description: z.string().optional(),
  starts_at: startsAtSchema,
  // Both render as clickable links for students; a length-free `z.string()`
  // accepted `javascript:…`, so they are constrained to absolute http(s) URLs.
  // Blank is still fine — the form submits "" for an unset field.
  meeting_url: optionalHttpUrlSchema,
  replay_url: optionalHttpUrlSchema,
  is_public: z.boolean(),
  mentor_id: z.string().uuid().nullish(),
  program_id: z.string().uuid().nullish(),
});

// `z.input`, not `z.infer`: the schema now transforms `starts_at`, so the
// caller supplies the pre-transform shape.
export type LiveClassInput = z.input<typeof schema>;

export async function saveLiveClass(input: LiveClassInput): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const d = parsed.data;
  const row = {
    title: d.title,
    description: d.description ?? null,
    // Already an ISO string — the schema converted it.
    starts_at: d.starts_at,
    meeting_url: d.meeting_url || null,
    replay_url: d.replay_url || null,
    is_public: d.is_public,
    mentor_id: d.mentor_id ?? null,
    program_id: d.program_id ?? null,
  };

  const { error } = d.id
    ? await supabase.from("live_classes").update(row).eq("id", d.id)
    : await supabase.from("live_classes").insert(row);
  if (error) return { error: "Could not save the live class." };

  revalidatePath("/admin/live-classes");
  revalidatePath("/live-classes");
  redirect("/admin/live-classes");
}

export async function deleteLiveClass(id: string): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("live_classes").delete().eq("id", id);
  if (error) {
    console.error("deleteLiveClass: delete failed", error);
    return { error: "Could not delete the live class. Please try again." };
  }
  revalidatePath("/admin/live-classes");
  return {};
}
