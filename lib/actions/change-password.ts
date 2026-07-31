"use server";

import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/settings";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Something went wrong" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.find(
      (i) => i.message === "Passwords do not match",
    );
    return {
      ok: false,
      error: mismatch ? "Passwords do not match" : "Something went wrong",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.password) {
      return { ok: false, error: "Something went wrong" };
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.password,
    );
    if (!valid) {
      return { ok: false, error: "Current password is incorrect" };
    }

    const password = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
