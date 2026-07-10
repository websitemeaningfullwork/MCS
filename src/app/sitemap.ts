import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL as siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return staticRoutes;

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [programs, mentors, resources, posts] = await Promise.all([
    supabase.from("programs").select("slug, updated_at").eq("status", "published"),
    supabase.from("mentors").select("id"),
    supabase.from("public_resources").select("slug"),
    supabase.from("blog_posts").select("slug, published_at").eq("status", "published"),
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
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
