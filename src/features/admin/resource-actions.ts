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

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  slug: z.string().min(3, "Enter a slug."),
  author: z.string().optional(),
  kind: z.enum([
    "ebook",
    "cv_template",
    "roadmap",
    "interview",
    "productivity",
    "scholarship",
    "other",
  ]),
  description: z.string().optional(),
  price_bdt: z.number().min(0),
  file_storage_path: z.string().optional(),
  is_featured: z.boolean(),
  is_premium: z.boolean(),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

export async function saveResource(input: ResourceInput): Promise<{ error?: string }> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };

  const d = parsed.data;
  const row = {
    title: d.title,
    slug: d.slug,
    author: d.author ?? null,
    kind: d.kind,
    description: d.description ?? null,
    price_bdt: d.price_bdt,
    is_featured: d.is_featured,
    is_premium: d.is_premium,
    ...(d.file_storage_path ? { file_storage_path: d.file_storage_path } : {}),
  };

  const { error } = d.id
    ? await supabase.from("resources").update(row).eq("id", d.id)
    : await supabase.from("resources").insert(row);
  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not save the resource." };
  }

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  redirect("/admin/resources");
}

export async function deleteResource(id: string): Promise<{ error?: string }> {
  const supabase = await assertAdmin();
  if (!supabase) return { error: "Not authorized." };
  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/admin/resources");
  return {};
}
