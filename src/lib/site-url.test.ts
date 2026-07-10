import { describe, it, expect } from "vitest";
import { absoluteUrl, SITE_URL } from "./site-url";

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
