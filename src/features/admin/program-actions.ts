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

const programSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  slug: z.string().min(3, "Enter a slug."),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  mentor_id: z.string().uuid().optional().or(z.literal("")),
  price_bdt: z.number().min(0),
  discount_bdt: z.number().min(0),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  learning_outcomes: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  is_featured: z.boolean(),
  status: z.enum(["draft", "published"]),
});

export type ProgramInput = z.infer<typeof programSchema>;

export async function saveProgram(input: ProgramInput): Promise<{ error?: string }> {
  const parsed = programSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const d = parsed.data;
  const row = {
    title: d.title,
    slug: d.slug,
    subtitle: d.subtitle ?? null,
    description: d.description ?? null,
    category_id: d.category_id ? d.category_id : null,
    mentor_id: d.mentor_id ? d.mentor_id : null,
    price_bdt: d.price_bdt,
    discount_bdt: d.discount_bdt,
    level: d.level,
    learning_outcomes: d.learning_outcomes ?? [],
    requirements: d.requirements ?? [],
    is_featured: d.is_featured,
    status: d.status,
    updated_at: new Date().toISOString(),
  };

  if (d.id) {
    const { error } = await supabase.from("programs").update(row).eq("id", d.id);
    if (error) {
      // 23505 is the slug unique violation — everything else is unexpected, so
      // log it (the admin only ever sees the friendly string).
      if (error.code === "23505") return { error: "That slug is already in use." };
      console.error("saveProgram: update failed", error);
      return { error: "Could not save the program." };
    }
    revalidatePath("/admin/programs");
    revalidatePath(`/programs/${d.slug}`);
    return {};
  }

  const { data: created, error } = await supabase
    .from("programs")
    .insert(row)
    .select("id")
    .single();
  if (error || !created) {
    if (error?.code === "23505") return { error: "That slug is already in use." };
    console.error("saveProgram: insert failed", error);
    return { error: "Could not create the program." };
  }
  revalidatePath("/admin/programs");
  redirect(`/admin/programs/${created.id}/edit`);
}

export async function deleteProgram(id: string): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) {
    console.error("deleteProgram: delete failed", error);
    return { error: "Could not delete the program. Please try again." };
  }
  revalidatePath("/admin/programs");
  return {};
}

export async function addModule(
  programId: string,
  title: string,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  if (!title.trim()) return { error: "Enter a module title." };

  // A failed count only costs us the sort_order hint (the insert below still
  // reports its own errors), so it stays non-fatal.
  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId);
  // The insert result was previously discarded: a constraint violation or an RLS
  // denial produced a success toast and no row. Check it like deleteModule does.
  const { error } = await supabase
    .from("modules")
    .insert({ program_id: programId, title: title.trim(), sort_order: count ?? 0 });
  if (error) {
    console.error("addModule: insert failed", error);
    return { error: "Could not add the module. Please try again." };
  }
  revalidatePath(`/admin/programs/${programId}/edit`);
  return {};
}

export async function deleteModule(
  moduleId: string,
  programId: string,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) {
    console.error("deleteModule: delete failed", error);
    return { error: "Could not delete the module. Please try again." };
  }
  revalidatePath(`/admin/programs/${programId}/edit`);
  return {};
}

export async function addLesson(
  moduleId: string,
  programId: string,
  input: {
    title: string;
    video_url: string;
    content_md: string;
    is_preview: boolean;
  },
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  if (!input.title.trim()) return { error: "Enter a lesson title." };

  // Non-fatal: a failed count only means a less useful sort_order default.
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);
  // Same silent-failure bug as addModule had — surface write errors instead of
  // reporting success for a lesson that was never persisted.
  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: input.title.trim(),
    video_url: input.video_url.trim() || null,
    content_md: input.content_md.trim() || null,
    is_preview: input.is_preview,
    sort_order: count ?? 0,
  });
  if (error) {
    console.error("addLesson: insert failed", error);
    return { error: "Could not add the lesson. Please try again." };
  }
  revalidatePath(`/admin/programs/${programId}/edit`);
  return {};
}

export async function deleteLesson(
  lessonId: string,
  programId: string,
): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) {
    console.error("deleteLesson: delete failed", error);
    return { error: "Could not delete the lesson. Please try again." };
  }
  revalidatePath(`/admin/programs/${programId}/edit`);
  return {};
}
