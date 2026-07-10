import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema } from "./schemas";

describe("registerSchema", () => {
  it("requires an 8+ char password and a 2+ char name", () => {
    expect(
      registerSchema.safeParse({ full_name: "Jo", email: "a@b.com", password: "12345678" }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ full_name: "J", email: "a@b.com", password: "12345678" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ full_name: "Jo", email: "a@b.com", password: "short" }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("fails when passwords do not match", () => {
    const res = resetPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd9999" });
    expect(res.success).toBe(false);
  });
  it("passes when they match", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd1234" }).success,
    ).toBe(true);
  });
});
