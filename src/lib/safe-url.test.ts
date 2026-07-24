import { describe, it, expect } from "vitest";
import {
  isHttpUrl,
  httpUrlSchema,
  optionalHttpUrlSchema,
  safeHref,
} from "./safe-url";

/**
 * Security contract for every URL that reaches an `href`. A regression here
 * re-opens the `javascript:` link vector on public mentor profiles, live-class
 * links, and lesson resources.
 */
describe("isHttpUrl", () => {
  it("accepts absolute http and https URLs", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("http://example.com/path?q=1#f")).toBe(true);
    expect(isHttpUrl("  https://example.com  ")).toBe(true); // trimmed
  });

  it("rejects script-bearing schemes regardless of casing or padding", () => {
    // Browsers normalise all of these back to `javascript:` before navigating,
    // which is exactly why a substring check is not good enough.
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isHttpUrl("  javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("java\tscript:alert(1)")).toBe(false);
    expect(isHttpUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects data: and file: URLs", () => {
    expect(isHttpUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isHttpUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects relative and protocol-relative input", () => {
    expect(isHttpUrl("example.com")).toBe(false);
    expect(isHttpUrl("/about")).toBe(false);
    expect(isHttpUrl("//evil.tld")).toBe(false);
  });

  it("rejects empty and nullish input", () => {
    expect(isHttpUrl("")).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
    expect(isHttpUrl(undefined)).toBe(false);
  });
});

describe("httpUrlSchema", () => {
  it("accepts a valid absolute URL", () => {
    expect(httpUrlSchema.safeParse("https://example.com").success).toBe(true);
  });

  it("rejects javascript: and blank values", () => {
    expect(httpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(httpUrlSchema.safeParse("").success).toBe(false);
  });

  it("rejects over-long links", () => {
    expect(
      httpUrlSchema.safeParse(`https://example.com/${"a".repeat(400)}`).success,
    ).toBe(false);
  });
});

describe("optionalHttpUrlSchema", () => {
  it("treats blank, null and undefined as 'no link'", () => {
    // Controlled React inputs submit "" for an empty field; the DB hands back
    // null. Both must pass, and both must normalise to "".
    for (const blank of ["", "   ", null, undefined]) {
      const res = optionalHttpUrlSchema.safeParse(blank);
      expect(res.success).toBe(true);
      if (res.success) expect(res.data).toBe("");
    }
  });

  it("still rejects a non-blank unsafe URL", () => {
    expect(optionalHttpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(optionalHttpUrlSchema.safeParse("//evil.tld").success).toBe(false);
  });

  it("passes through and trims a valid URL", () => {
    const res = optionalHttpUrlSchema.safeParse("  https://example.com  ");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe("https://example.com");
  });
});

describe("safeHref", () => {
  it("returns the URL when safe, null when not", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.tld")).toBeNull();
    expect(safeHref(null)).toBeNull();
  });
});
