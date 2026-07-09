import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { EmptyState } from "@/components/marketing/empty-state";
import { deleteBlogPost } from "@/features/admin/blog-actions";

export const metadata: Metadata = { title: "Blog admin" };

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Blog
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/admin/blog/new">
            <Plus className="size-4" />
            New post
          </Link>
        </Button>
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState title="No posts" description="Create your first blog post." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status}
                </Badge>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/blog/${p.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteButton id={p.id} onDelete={deleteBlogPost} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
