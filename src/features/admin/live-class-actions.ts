"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  description: z.string().optional(),
  starts_at: z.string().min(1, "Pick a date and time."),
  meeting_url: z.string().optional(),
  replay_url: z.string().optional(),
  is_public: z.boolean(),
});

export type LiveClassInput = z.infer<typeof schema>;

export async function saveLiveClass(input: LiveClassInput): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const d = parsed.data;
  const row = {
    title: d.title,
    description: d.description ?? null,
    starts_at: new Date(d.starts_at).toISOString(),
    meeting_url: d.meeting_url ?? null,
    replay_url: d.replay_url ?? null,
    is_public: d.is_public,
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
  await supabase.from("live_classes").delete().eq("id", id);
  revalidatePath("/admin/live-classes");
  return {};
}
