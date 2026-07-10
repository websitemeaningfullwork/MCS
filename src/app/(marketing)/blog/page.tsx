import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/marketing/empty-state";
import { Pagination, parsePage } from "@/components/marketing/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Career tips, programming, admission guidance, AI, and productivity — from the MCA mentors.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  const { data: postsData } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, tags, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  let posts = postsData ?? [];

  const tagSet = new Set<string>();
  posts.forEach((p) => (p.tags ?? []).forEach((t) => tagSet.add(t)));
  const tags = [...tagSet].sort();

  if (tag) posts = posts.filter((p) => (p.tags ?? []).includes(tag));

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The MCA Blog
        </h1>
        <p className="mt-3 text-muted-foreground">
          Guidance, strategies, and stories to help you build a meaningful
          career.
        </p>
      </header>

      {tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              !tag
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                tag === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </Link>
          ))}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No posts yet" description="Check back soon for new articles." />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {pagePosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-brand-hover/15">
                <span className="px-6 text-center font-semibold text-primary/40">
                  {post.title}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                {post.published_at ? (
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                ) : null}
                <h2 className="mt-1 font-semibold text-foreground">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
          </div>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
