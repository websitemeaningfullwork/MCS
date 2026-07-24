import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy — shipped in **Report-Only** mode.
 *
 * Why it exists: the app renders admin-authored HTML with
 * `dangerouslySetInnerHTML` (the class Overview tab) and embeds third-party
 * iframes. Those inputs are now sanitized and host-checked, but CSP is the
 * compensating control that contains anything those layers miss — it is the
 * difference between a stripped tag and a stolen session.
 *
 * Why Report-Only first: an enforcing CSP that is even slightly too narrow
 * takes the site down (blank pages, dead embeds). Report-Only makes the browser
 * log every would-be violation to the console without blocking anything, so we
 * can watch real traffic before committing.
 *
 * MIGRATION PATH — Report-Only → enforce:
 *  1. Deploy as-is and watch browser consoles / a reporting endpoint for
 *     "Content-Security-Policy-Report-Only" violations across the real routes:
 *     marketing pages, the course player (YouTube), admin editors (uploads),
 *     and anything doing Supabase realtime.
 *  2. Widen only the directives that genuinely fire, one host at a time.
 *  3. When the report stream is quiet, rename the header key below to
 *     "Content-Security-Policy". Nothing else changes.
 *  4. Follow-up hardening, deliberately out of scope here because it forces
 *     every page to render dynamically: replace `'unsafe-inline'` in
 *     `script-src` with a per-request nonce issued from `proxy.ts` (see the
 *     Next.js "Content Security Policy" guide). Until then `script-src` is the
 *     weakest directive in this policy and the rest of it is what carries the
 *     protection.
 */
const csp = [
  // Everything not covered by a more specific directive falls back to same-origin.
  "default-src 'self'",

  // Next.js App Router inlines its bootstrap + streamed RSC payload into the
  // document, so 'unsafe-inline' is required until we adopt nonces (step 4).
  // 'unsafe-eval' is dev-only: React uses eval there to rebuild server error
  // stacks in the browser. Neither React nor Next.js eval in production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,

  // Tailwind ships as a static stylesheet, but next/font and several UI
  // primitives set inline style attributes, which 'unsafe-inline' covers.
  // Style injection is a far weaker primitive than script injection.
  "style-src 'self' 'unsafe-inline'",

  // Deliberately permissive: avatars come from arbitrary OAuth providers
  // (Google, Facebook, GitHub…) and are rendered with raw <img> precisely
  // because the host set is unbounded — see components/reviews/review-card.tsx
  // and components/marketing/testimonial-carousel.tsx. `https:` still blocks
  // http:, and images are not an script-execution vector. `data:`/`blob:` cover
  // next/image placeholders and client-side upload previews.
  "img-src 'self' data: blob: https:",

  // next/font/google downloads and self-hosts the font files at build time, so
  // fonts.googleapis.com / fonts.gstatic.com are NOT contacted at runtime and
  // are intentionally absent here. Verified: the only font usage is
  // `next/font/google` in src/app/layout.tsx — there is no <link> to Google
  // Fonts anywhere. If a raw @import or <link> is ever added, this breaks and
  // those two hosts must be allowed back in.
  "font-src 'self' data:",

  // Supabase: PostgREST/Auth/Storage over https, realtime over wss. The dev
  // websocket is Next.js HMR.
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws://localhost:* http://localhost:*" : ""}`,

  // Only YouTube may be framed by us. Pairs with the host allowlist in
  // src/lib/youtube.ts so an attacker-controlled "/embed/" URL can't be framed
  // even if it slips past that helper.
  "frame-src 'self' https://www.youtube-nocookie.com https://youtube-nocookie.com https://www.youtube.com https://youtube.com",

  // Anti-clickjacking. Mirrors the X-Frame-Options: SAMEORIGIN below for older
  // browsers; frame-ancestors is the modern directive and wins where supported.
  "frame-ancestors 'self'",

  // Legacy plugin content (<object>/<embed>/<applet>) has no use here and is a
  // classic script-execution bypass.
  "object-src 'none'",

  // Stops injected markup from rewriting <base href> and re-pointing every
  // relative script/link URL at an attacker's origin.
  "base-uri 'self'",

  // Server Actions post back to our own origin; nothing should submit elsewhere.
  "form-action 'self'",

  // Blob workers are used by some client bundles; keep them same-origin.
  "worker-src 'self' blob:",
].join("; ");

// Baseline security headers applied to every route.
const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (avatars, covers).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
