import { describe, expect, it } from "vitest";
import { changePasswordSchema, deleteAccountSchema } from "./settings";

describe("changePasswordSchema", () => {
  it("accepts valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "newpass12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirm", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Passwords do not match");
    }
  });
});

describe("deleteAccountSchema", () => {
  it("accepts current password", () => {
    const result = deleteAccountSchema.safeParse({
      currentPassword: "oldpass12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = deleteAccountSchema.safeParse({ currentPassword: "" });
    expect(result.success).toBe(false);
  });
});
