/**
 * Central URL validation for anything that can end up in an `href`, an `<img
 * src>`, or an `<iframe src>`.
 *
 * Why this exists: admin forms and the mentor self-service profile accept
 * free-text "url" fields that are later rendered as raw anchors. Length-only
 * validation (`z.string().max(300)`) happily accepts `javascript:alert(1)` and
 * `data:text/html;base64,…`, both of which execute in the visitor's origin the
 * moment somebody clicks the link. Parsing with the WHATWG `URL` constructor
 * and allowlisting the protocol is the only reliable way to block that — a
 * substring/regex check on the string is trivially bypassed with whitespace,
 * newlines, or `JaVaScRiPt:`, all of which browsers normalise away.
 *
 * Use the schemas for write-time validation (server actions) and `safeHref`
 * for render-time defence on rows that predate this validation.
 */

import { z } from "zod";

/** Protocols we are willing to put in a user-clickable link. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * True only for absolute http(s) URLs.
 *
 * `new URL()` throws on relative input (e.g. "example.com" or "/about"), which
 * is intentional: every field using this schema is an external link, so an
 * absolute URL is always required. It does NOT throw on `javascript:` — that
 * parses fine — hence the explicit protocol check.
 */
export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

const URL_MESSAGE = "Enter a full link starting with http:// or https://";

/** Absolute http(s) URL. Required — use `optionalHttpUrlSchema` for blanks. */
export const httpUrlSchema = z
  .string()
  .trim()
  .max(300, "That link is too long.")
  .refine(isHttpUrl, { message: URL_MESSAGE });

/**
 * Optional absolute http(s) URL.
 *
 * Admin forms are controlled React inputs, so a blank field submits `""`, not
 * `undefined` — and some callers pass `null` straight from the database. All
 * three mean "no link". The output is normalised to a trimmed string ("" when
 * blank) so existing callers that do `d.linkedin_url || null` keep working.
 */
export const optionalHttpUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value === "" || isHttpUrl(value), { message: URL_MESSAGE })
  .refine((value) => value.length <= 300, { message: "That link is too long." });

/**
 * Render-time defence: returns the URL only when it is a safe http(s) link,
 * otherwise `null` so the caller can skip rendering the anchor entirely.
 *
 * This exists so rows written before the schemas above landed cannot fire a
 * `javascript:` payload — no data migration required.
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!isHttpUrl(url)) return null;
  return (url as string).trim();
}
