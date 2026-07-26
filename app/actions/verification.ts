"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { setTokens } from "@/lib/security/jwt";
import { logSessionEvent } from "@/lib/security/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { Role } from "@prisma/client";

/**
 * Validates a verification token given as query param
 */
export async function validateToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { success: false, error: "Invalid token" };
  }

  if (new Date() > record.expires) {
    return { success: false, error: "Token expired" };
  }

  // Find associated user to display name
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  return {
    success: true,
    email: record.identifier,
    name: user.name,
    username: user.username,
  };
}

/**
 * Completes registration: Sets password, Activates user, Deletes token, Logs in
 */
export async function completeRegistration(token: string, password: string) {
  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || new Date() > record.expires) {
      return { success: false, error: "Token invalid or expired" };
    }

    const { identifier } = record;

    const user = await prisma.user.findUnique({
      where: { email: identifier },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const hashedPassword = await hashPassword(password);

    // Update User
    const updatedUser = await prisma.user.update({
      where: { email: identifier },
      data: {
        password: hashedPassword,
        status: "ACTIVE",
      },
    });

    // Delete Token (prevent reuse)
    await prisma.verificationToken.delete({
      where: { token },
    });

    const userRole = user.userRoles[0]?.role.name || "USER";

    // Auto Login (Set Cookies)
    await setTokens(updatedUser.id, userRole, updatedUser.companyId);

    await logSessionEvent(
      updatedUser.id,
      userRole,
      "LOGIN",
      "User activated account and logged in",
    );

    return { success: true };
  } catch (error) {
    console.error("Complete Registration Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Request Password Reset
 */
export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Security: Do not reveal if user doesn't exist.
      // But for this system context, maybe we can return specific error or generic success
      return { success: true, message: "If account exists, email sent." };
    }

    // Generate Token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token (reusing VerificationToken table or separate PasswordResetToken?)
    // Schema has PasswordResetToken table. Let's use it.
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: expires,
      },
    });

    // Send Email
    await sendPasswordResetEmail(email, token, user.name);

    return { success: true };
  } catch (error) {
    console.error("Request Password Reset Error:", error);
    return { success: false, error: "Failed to process request" };
  }
}

/**
 * Validate Password Reset Token (for UI check)
 */
export async function validatePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) return { success: false, error: "Invalid token" };
  if (new Date() > record.expiresAt)
    return { success: false, error: "Token expired" };

  return { success: true };
}

/**
 * Reset Password with Token
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || new Date() > record.expiresAt) {
      return { success: false, error: "Token invalid or expired" };
    }

    const hashedPassword = await hashPassword(newPassword);

    // Update User
    await prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
      },
    });

    // Delete token to prevent reuse
    await prisma.passwordResetToken.delete({
      where: { id: record.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
