import type { MetadataRoute } from "next";
import { SITE_URL as siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/admin/",
        "/mentor/",
        "/checkout",
        "/auth/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
