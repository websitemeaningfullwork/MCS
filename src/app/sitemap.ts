import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL as siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public, indexable content routes.
  //
  // `/appointments` is deliberately NOT listed: the page redirects anonymous
  // visitors (crawlers included) to `/login?next=/appointments`, and `/login` is
  // disallowed in robots.ts. A sitemap should only advertise URLs that actually
  // serve content to an unauthenticated crawler, so listing it would just point
  // Google at a redirect into a blocked path. The booking flow is still reachable
  // from the navbar for signed-in users.
  const contentRoutes = [
    "",
    "/programs",
    "/mentors",
    "/resources",
    "/blog",
    "/live-classes",
    "/mock-tests",
    "/community",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  // Policy pages — public and indexable, but rarely change and rank low.
  const legalRoutes = ["/privacy", "/terms", "/refund"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  const staticRoutes = [...contentRoutes, ...legalRoutes];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return staticRoutes;

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [programs, mentors, resources, posts, mockTests] = await Promise.all([
    supabase.from("programs").select("slug, updated_at").eq("status", "published"),
    supabase.from("public_mentors").select("id"),
    supabase.from("public_resources").select("slug"),
    supabase.from("blog_posts").select("slug, published_at").eq("status", "published"),
    supabase.from("mock_tests").select("slug, created_at"),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(programs.data ?? []).map((p) => ({
      url: `${siteUrl}/programs/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(mentors.data ?? []).map((m) => ({
      url: `${siteUrl}/mentors/${m.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(resources.data ?? []).map((r) => ({
      url: `${siteUrl}/resources/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(posts.data ?? []).map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(mockTests.data ?? []).map((t) => ({
      url: `${siteUrl}/mock-tests/${t.slug}`,
      lastModified: t.created_at ? new Date(t.created_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
