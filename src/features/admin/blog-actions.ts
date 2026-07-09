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
  return profile?.role === "admin" ? { supabase, userId: user.id } : null;
}

const blogSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Enter a title."),
  slug: z.string().min(3, "Enter a slug."),
  excerpt: z.string().optional(),
  content_md: z.string().optional(),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).optional(),
});

export type BlogInput = z.infer<typeof blogSchema>;

export async function saveBlogPost(input: BlogInput): Promise<{ error?: string }> {
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form." };

  const ctx = await assertAdmin();
  if (!ctx) return { error: "Not authorized." };
  const { supabase, userId } = ctx;

  let publishedAt: string | null = null;
  if (parsed.data.status === "published") {
    if (parsed.data.id) {
      const { data: existing } = await supabase
        .from("blog_posts")
        .select("published_at")
        .eq("id", parsed.data.id)
        .maybeSingle();
      publishedAt = existing?.published_at ?? new Date().toISOString();
    } else {
      publishedAt = new Date().toISOString();
    }
  }

  const row = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt ?? null,
    content_md: parsed.data.content_md ?? null,
    status: parsed.data.status,
    tags: parsed.data.tags ?? [],
    published_at: publishedAt,
    author_id: userId,
  };

  const { error } = parsed.data.id
    ? await supabase.from("blog_posts").update(row).eq("id", parsed.data.id)
    : await supabase.from("blog_posts").insert(row);

  if (error) {
    if (error.code === "23505") return { error: "That slug is already in use." };
    return { error: "Could not save the post." };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string): Promise<{ error?: string }> {
  const ctx = await assertAdmin();
  if (!ctx) return { error: "Not authorized." };
  await ctx.supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return {};
}
