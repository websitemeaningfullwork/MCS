import { describe, it, expect } from "vitest";
import { formatBDT, effectivePriceBDT, hasDiscount, levelLabel } from "./format";

describe("formatBDT", () => {
  it("renders Free for zero / null / negative", () => {
    expect(formatBDT(0)).toBe("Free");
    expect(formatBDT(null)).toBe("Free");
    expect(formatBDT(undefined)).toBe("Free");
    expect(formatBDT(-5)).toBe("Free");
  });

  it("formats positive amounts with the taka sign and thousands separators", () => {
    expect(formatBDT(1500)).toBe("৳1,500");
    expect(formatBDT(999.6)).toBe("৳1,000"); // rounds
  });
});

describe("effectivePriceBDT", () => {
  it("returns the base price when there is no valid discount", () => {
    expect(effectivePriceBDT(1000, 0)).toBe(1000);
    expect(effectivePriceBDT(1000, null)).toBe(1000);
    expect(effectivePriceBDT(1000, 1000)).toBe(1000); // discount not < base
    expect(effectivePriceBDT(1000, 2000)).toBe(1000); // discount above base ignored
  });

  it("returns the discounted price when the discount is valid", () => {
    expect(effectivePriceBDT(1000, 600)).toBe(600);
  });

  it("treats missing base as 0", () => {
    expect(effectivePriceBDT(null, null)).toBe(0);
  });

  // Guard rail: `discount_bdt` is the FINAL price a student pays, NOT an
  // amount subtracted from the price. Two admin forms once labelled this
  // column inconsistently ("Discount (BDT)" vs "Discount price (BDT)"), which
  // meant an admin entering 500 to mean "৳500 off" a ৳5,000 course would have
  // sold it for ৳500. If someone ever "fixes" this to subtract, this test
  // fails loudly rather than silently repricing the catalogue.
  it("treats discount_bdt as the final price, not the amount off", () => {
    expect(effectivePriceBDT(5000, 500)).toBe(500);
    expect(effectivePriceBDT(5000, 500)).not.toBe(4500);
  });
});

describe("hasDiscount", () => {
  it("is true only for a positive discount below the price", () => {
    expect(hasDiscount(1000, 600)).toBe(true);
    expect(hasDiscount(1000, 0)).toBe(false);
    expect(hasDiscount(1000, 1000)).toBe(false);
    expect(hasDiscount(null, 600)).toBe(false);
  });
});

describe("levelLabel", () => {
  it("maps known levels and falls back to All levels", () => {
    expect(levelLabel("beginner")).toBe("Beginner");
    expect(levelLabel("all_levels")).toBe("All levels");
    expect(levelLabel(null)).toBe("All levels");
    expect(levelLabel("nonsense")).toBe("All levels");
  });
});
