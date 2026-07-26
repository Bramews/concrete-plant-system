"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/lib/logger";

export async function updateProfile(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const name = formData.get("name") as string;

    // Validate inputs
    if (!name || name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { name },
    });

    await logEvent({
      action: "PROFILE_UPDATE",
      entity: "User",
      entityId: session.userId,
      details: `User updated their profile name to ${name}`,
    });

    revalidatePath("/system/profile");
    revalidatePath("/", "layout"); // Update header name
    return { success: true, message: "Profile updated successfully" };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function changePassword(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      throw new Error("New passwords do not match");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) throw new Error("User not found");

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        password: hashedPassword,
      },
    });

    await logEvent({
      action: "PASSWORD_CHANGE",
      entity: "User",
      entityId: session.userId,
      details: "User changed their password",
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
