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
  /**
   * A Supabase Storage object key (e.g. "resources/<uuid>.pdf"), NOT a URL —
   * it is only ever handed to `storage.from(...).createSignedUrl()` in
   * app/dashboard/resources/[id]/download/route.ts, which produces the href.
   * So it deliberately does not use the http(s) URL schemas: an absolute URL
   * here would simply fail to resolve to an object, never render as a link.
   *
   * NOTE: the `resources` table also has an `external_url` column, but this
   * schema and the admin form do not expose it, so there is no write path to
   * validate today. If it is ever surfaced in the form it must use
   * `optionalHttpUrlSchema` from @/lib/safe-url — it would be rendered as an
   * anchor, exactly like the mentor social links.
   */
  file_storage_path: z.string().optional(),
  is_featured: z.boolean(),
  is_premium: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
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
    status: d.status,
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
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) {
    console.error("deleteResource: delete failed", error);
    return { error: "Could not delete the resource. Please try again." };
  }
  revalidatePath("/admin/resources");
  return {};
}
