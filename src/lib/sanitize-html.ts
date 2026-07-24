/**
 * HTML sanitizer for admin-authored rich text (currently the class "Overview"
 * tab, which is rendered with `dangerouslySetInnerHTML`).
 *
 * The overview editor is a `contentEditable` surface whose raw `innerHTML` is
 * posted to the server, so whatever the browser produces — including anything
 * pasted in, and anything an attacker crafts by calling the server action
 * directly — used to be persisted and re-rendered verbatim. That is a stored
 * XSS sink. This module is the single choke point that turns arbitrary HTML
 * into the small, presentational subset the Overview tab actually needs.
 *
 * Applied twice on purpose (defence in depth):
 *  - on write, in `features/admin/program-editor-actions.ts`, so the database
 *    never holds a payload; and
 *  - on read, in the learn route's server component, so rows written before
 *    this landed are neutralised without a data migration.
 *
 * Deliberately NOT importing "server-only": both call sites are server-side
 * today, but keeping the module isomorphic means a future client-side preview
 * can reuse the exact same allowlist instead of inventing a second one.
 */

import sanitizeHtmlLib from "sanitize-html";
import type { IOptions } from "sanitize-html";

/**
 * Colour values we accept inside the two style properties below. The editor's
 * highlight button goes through `document.execCommand("hiliteColor")`, which
 * browsers serialise as `rgb(254, 240, 138)`, so the rgb/rgba forms must be
 * allowed alongside hex and CSS colour keywords.
 */
const COLOR_VALUES = [
  /^#(?:[0-9a-f]{3,8})$/i, // #fff, #ffffff, #ffffffff
  /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)$/i,
  /^[a-z]+$/i, // CSS colour keywords: yellow, transparent, currentColor…
];

const OPTIONS: IOptions = {
  /**
   * Strict presentational allowlist. Everything else (script, iframe, object,
   * embed, form, input, style, svg, math, img…) is dropped. Note the absence
   * of `img`: the Overview tab has no image affordance, and an `<img
   * onerror>` is the classic way back into script execution.
   */
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "span",
    "mark",
    "code",
    "pre",
  ],

  /**
   * Attribute allowlist. This is an allowlist, not a denylist, so every `on*`
   * event handler (onclick, onerror, onmouseover, …) is stripped simply by not
   * appearing here. sanitize-html also drops them by default, but stating the
   * rule explicitly means a future edit that widens `allowedAttributes` can't
   * silently reintroduce handlers — so keep this list closed.
   */
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    span: ["style"],
    mark: ["style"],
  },

  /**
   * Only these two properties survive on span/mark, and only with a value
   * matching `COLOR_VALUES`. Unrestricted `style` is an injection vector of
   * its own (`background: url(...)`, `position: fixed` overlays for
   * clickjacking), so the narrow pair the highlight button needs is all we
   * take.
   */
  allowedStyles: {
    span: { "background-color": COLOR_VALUES, color: COLOR_VALUES },
    mark: { "background-color": COLOR_VALUES, color: COLOR_VALUES },
  },

  /**
   * THE control that blocks `javascript:` (and `data:`, `vbscript:`) in hrefs.
   * Anything outside this list makes sanitize-html drop the attribute.
   */
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  // `//evil.com` inherits the page protocol and would otherwise sneak past the
  // scheme allowlist, so protocol-relative URLs are rejected too.
  allowProtocolRelative: false,

  /**
   * Discard disallowed tags but keep their text, so stripping e.g. a stray
   * `<div>` wrapper does not silently delete the admin's copy.
   */
  disallowedTagsMode: "discard",
  // ...but for these, the *content* is the dangerous part, so drop it as well.
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],

  transformTags: {
    // Every surviving link opens in a new tab with a hardened rel: `noopener`
    // and `noreferrer` stop the opened page reaching back via `window.opener`,
    // `nofollow` keeps admin-authored links from passing SEO value.
    a: sanitizeHtmlLib.simpleTransform("a", {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    }),
  },
};

/**
 * Sanitize admin-authored rich text down to the allowlist above.
 *
 * Returns "" for null/undefined/blank input so callers can store a consistent
 * empty value rather than juggling three flavours of "nothing".
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtmlLib(html, OPTIONS);
}
