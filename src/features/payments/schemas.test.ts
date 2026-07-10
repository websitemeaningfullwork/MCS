import { describe, it, expect } from "vitest";
import { manualPaymentSchema } from "./schemas";

const valid = {
  type: "program" as const,
  id: "11111111-1111-4111-8111-111111111111",
  sender_number: "01712345678",
  transaction_id: "9AB1C2D3E4",
  paid_amount_bdt: 1500,
};

describe("manualPaymentSchema", () => {
  it("accepts a well-formed submission", () => {
    expect(manualPaymentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-uuid item id", () => {
    expect(manualPaymentSchema.safeParse({ ...valid, id: "nope" }).success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(manualPaymentSchema.safeParse({ ...valid, paid_amount_bdt: 0 }).success).toBe(false);
  });

  it("rejects an invalid item type", () => {
    expect(manualPaymentSchema.safeParse({ ...valid, type: "course" }).success).toBe(false);
  });

  it("treats screenshot_path as optional", () => {
    const { screenshot_path, ...noShot } = { ...valid, screenshot_path: undefined };
    void screenshot_path;
    expect(manualPaymentSchema.safeParse(noShot).success).toBe(true);
  });
});
