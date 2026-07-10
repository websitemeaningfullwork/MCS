import { describe, it, expect } from "vitest";
import { absoluteUrl, SITE_URL, safeNextPath } from "./site-url";

describe("absoluteUrl", () => {
  it("returns the base URL for an empty path", () => {
    expect(absoluteUrl()).toBe(SITE_URL);
    expect(absoluteUrl("")).toBe(SITE_URL);
  });
  it("joins a leading-slash path", () => {
    expect(absoluteUrl("/auth/callback")).toBe(`${SITE_URL}/auth/callback`);
  });
  it("adds a missing leading slash", () => {
    expect(absoluteUrl("auth/callback")).toBe(`${SITE_URL}/auth/callback`);
  });
  it("never emits a double slash after the origin", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows plain local paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/checkout?type=program&id=abc")).toBe("/checkout?type=program&id=abc");
  });
  it("falls back for empty/missing input", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
    expect(safeNextPath(null, "/mentor")).toBe("/mentor");
  });
  it("rejects protocol-relative and backslash open-redirect tricks", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\t/evil.com")).toBe("/dashboard");
  });
  it("rejects absolute external URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("http://evil.com")).toBe("/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });
});
