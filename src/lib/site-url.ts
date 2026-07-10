/**
 * Single source of truth for the site's public base URL.
 *
 * Reads `NEXT_PUBLIC_SITE_URL`, validates it once, and normalizes away any
 * trailing slash so callers can safely concatenate paths. Everything that
 * builds an absolute URL (auth redirects, email links, sitemap, metadata)
 * MUST go through here so a misconfigured env can't silently point OAuth or
 * password-reset links at the wrong origin.
 */
const FALLBACK = "http://localhost:3000";

function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK;
  try {
    // Throws on a malformed value (e.g. missing protocol) — fall back instead
    // of emitting broken links.
    const url = new URL(raw);
    return url.origin;
  } catch {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `NEXT_PUBLIC_SITE_URL is not a valid absolute URL: "${raw}". Falling back to ${FALLBACK}.`,
      );
    }
    return FALLBACK;
  }
}

/** The validated, trailing-slash-free base URL, e.g. `https://mca.academy`. */
export const SITE_URL = resolveBaseUrl();

/** Build an absolute URL for a same-site path. `path` should start with `/`. */
export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
