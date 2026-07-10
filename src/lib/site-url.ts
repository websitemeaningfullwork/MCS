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

/**
 * Sanitize a user-supplied `?next=` redirect target to a safe same-site path.
 *
 * A naive `startsWith("/")` check is NOT enough: `//evil.com` and `/\evil.com`
 * both start with `/` yet resolve to an EXTERNAL origin (protocol-relative /
 * backslash tricks), enabling an open-redirect after login/OAuth. We only allow
 * a single leading slash NOT followed by another slash or backslash, and reject
 * anything that isn't a plain local path. Falls back to the given default.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  // Must start with exactly one "/", and the next char must not be "/" or "\".
  if (!/^\/(?![/\\])/.test(next)) return fallback;
  // Defensively reject control chars and backslashes anywhere in the path.
  if (/[\\\x00-\x1f]/.test(next)) return fallback;
  return next;
}
