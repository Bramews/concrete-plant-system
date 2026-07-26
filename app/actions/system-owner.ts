"use server";

import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyPassword } from "@/lib/security/password";
import { signJWT } from "@/lib/security/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginSystemOwner(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: "Invalid input" };
  }

  const { email, password } = validated.data;

  try {
    // Phase 3: Unifying with User model for Session compatibility
    const user = (await prisma.user.findFirst({
      where: { email },
      include: {
        memberships: { include: { role: true } },
      },
    })) as any;

    if (!user) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { error: "Invalid credentials" };
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.password);

    // Fallback for Phase 0 cleartext if needed, though seed uses hash
    if (!passwordValid) {
      return { error: "Invalid credentials" };
    }

    // Verify Role
    const isOwner = user.memberships.some(
      (m: any) => m.role.name === "SYSTEM_OWNER",
    );
    if (!isOwner) {
      return { error: "Unauthorized access" };
    }

    // Create Session
    const { token } = await createSession(user.id, user.companyId ?? undefined);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    // JWT for Middleware (Admin Access Bypass)
    const accessToken = await signJWT(
      {
        userId: user.id,
        role: "SYSTEM_OWNER",
        companyId: null,
      },
      60 * 60 * 24,
    ); // 24 hours

    cookieStore.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("System Owner Login Error:", error);
    return { error: "Authentication system failure" };
  }
}
