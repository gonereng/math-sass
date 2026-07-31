"use server";

import { auth } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  deleteAccountSchema,
  type DeleteAccountInput,
} from "@/lib/validations/settings";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteAccount(
  input: DeleteAccountInput,
): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Something went wrong" };
  }

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong" };
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

    await prisma.user.delete({ where: { id: user.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
