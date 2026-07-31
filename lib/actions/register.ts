"use server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong" };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "Email already in use" };
    }

    const password = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
