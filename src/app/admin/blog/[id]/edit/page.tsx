import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to blog
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Edit post
      </h1>
      <BlogPostForm
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content_md: post.content_md ?? "",
          status: (post.status ?? "draft") as "draft" | "published",
          tags: post.tags ?? [],
        }}
      />
    </div>
  );
}
