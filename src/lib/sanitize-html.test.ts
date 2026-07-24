import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "./sanitize-html";

/**
 * These tests pin the security contract of the app's only HTML sanitizer.
 * `overview_html` is rendered with `dangerouslySetInnerHTML` in the course
 * player, so a regression here is a stored-XSS regression. Treat a failure as
 * a security incident, not a formatting nit.
 */
describe("sanitizeRichText — script execution vectors", () => {
  it("drops script tags and their contents", () => {
    const out = sanitizeRichText('<p>hi</p><script>alert(1)</script>');
    expect(out).toContain("hi");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert(1)");
  });

  it("strips every on* event handler", () => {
    for (const attr of ["onerror", "onclick", "onmouseover", "onload", "onfocus"]) {
      const out = sanitizeRichText(`<p ${attr}="alert(1)">text</p>`);
      expect(out).not.toContain(attr);
      expect(out).not.toContain("alert(1)");
    }
  });

  it("drops img entirely (the classic onerror vector)", () => {
    const out = sanitizeRichText('<img src=x onerror="alert(1)">');
    expect(out).not.toContain("img");
    expect(out).not.toContain("onerror");
  });

  it("drops iframe, object, embed and form", () => {
    const out = sanitizeRichText(
      '<iframe src="https://evil.tld"></iframe><object></object><embed><form><input></form>',
    );
    for (const tag of ["iframe", "object", "embed", "form", "input"]) {
      expect(out).not.toContain(`<${tag}`);
    }
  });

  it("drops style tags and their contents", () => {
    const out = sanitizeRichText("<style>body{display:none}</style><p>ok</p>");
    expect(out).not.toContain("display:none");
    expect(out).toContain("ok");
  });
});

describe("sanitizeRichText — href scheme allowlist", () => {
  it("removes javascript: hrefs", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("removes data: hrefs", () => {
    const out = sanitizeRichText(
      '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>',
    );
    expect(out).not.toContain("data:");
  });

  it("removes protocol-relative hrefs, which inherit the page scheme", () => {
    const out = sanitizeRichText('<a href="//evil.tld/x">x</a>');
    expect(out).not.toContain("evil.tld");
  });

  it("keeps http, https and mailto, and hardens rel/target", () => {
    const out = sanitizeRichText('<a href="https://example.com">x</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
    expect(sanitizeRichText('<a href="mailto:a@b.co">x</a>')).toContain("mailto:");
  });
});

describe("sanitizeRichText — style allowlist", () => {
  it("keeps the highlight button's background-color on span/mark", () => {
    const out = sanitizeRichText('<span style="background-color: rgb(254, 240, 138)">x</span>');
    expect(out).toContain("background-color");
  });

  it("drops style properties outside the allowlist", () => {
    const out = sanitizeRichText(
      '<span style="position: fixed; top: 0; background: url(https://evil.tld/x)">x</span>',
    );
    expect(out).not.toContain("position");
    expect(out).not.toContain("evil.tld");
  });

  it("preserves the editor's alignment output on block tags", () => {
    // Regression guard: an early version of the allowlist dropped `div` and
    // `text-align`, which silently mangled the align buttons' output on save.
    const out = sanitizeRichText('<div style="text-align: center">x</div>');
    expect(out).toContain("text-align");
    expect(out).toContain("center");
  });

  it("still rejects non-alignment styles on those same block tags", () => {
    const out = sanitizeRichText('<div style="position: fixed">x</div>');
    expect(out).not.toContain("position");
  });
});

describe("sanitizeRichText — content preservation", () => {
  it("keeps the presentational subset the editor produces", () => {
    const html =
      "<h2>Title</h2><p><strong>bold</strong> <em>italic</em> <u>under</u></p><ul><li>one</li></ul>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("keeps text from disallowed wrappers rather than deleting copy", () => {
    expect(sanitizeRichText("<section>kept</section>")).toContain("kept");
  });

  it("normalises nullish input to an empty string", () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
    expect(sanitizeRichText("")).toBe("");
  });
});
