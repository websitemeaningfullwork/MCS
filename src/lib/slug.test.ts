import { describe, it, expect } from "vitest";
import { slugify, linesToArray, arrayToLines } from "./slug";

describe("slugify", () => {
  it("lowercases, trims, and hyphenates", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });
  it("strips punctuation and collapses separators", () => {
    expect(slugify("A/B  &  C!!")).toBe("ab-c");
    expect(slugify("multiple   spaces")).toBe("multiple-spaces");
  });
  it("removes leading and trailing hyphens", () => {
    expect(slugify("--edge--")).toBe("edge");
  });
});

describe("linesToArray / arrayToLines", () => {
  it("splits lines, trims, and drops blanks", () => {
    expect(linesToArray("a\n  b  \n\n c")).toEqual(["a", "b", "c"]);
  });
  it("round-trips with arrayToLines", () => {
    expect(arrayToLines(["a", "b"])).toBe("a\nb");
    expect(arrayToLines(null)).toBe("");
  });
});
