import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata: Metadata = { title: "New post" };

export default async function NewBlogPostPage() {
  await requireAdmin();
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
        New blog post
      </h1>
      <BlogPostForm />
    </div>
  );
}
