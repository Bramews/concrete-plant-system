"use server";

import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function panicLockdown(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireRole(["SYSTEM_OWNER"]);
  } catch {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  try {
    // 1. Kill cloudflared immediately
    if (process.platform === "win32") {
      try {
        execSync("taskkill /f /im cloudflared.exe");
      } catch (e) {}
    } else {
      try {
        execSync("killall cloudflared");
      } catch (e) {}
    }

    // 2. Set system_lockdown setting to "true"
    await prisma.systemSetting.upsert({
      where: { key: "system_lockdown" },
      update: { value: "true" },
      create: { key: "system_lockdown", value: "true" },
    });

    // 3. Invalidate ALL sessions in the database
    await prisma.session.updateMany({
      data: { isRevoked: true },
    });

    // 4. Log audit log or action log
    console.warn("!!! SYSTEM PANIC LOCKDOWN ACTIVATED !!!");

    return { success: true };
  } catch (error: unknown) {
    console.error("Panic lockdown failed:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل تنشيط وضع الطوارئ",
    };
  }
}

export async function liftLockdown(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Set system_lockdown setting to "false"
    await prisma.systemSetting.upsert({
      where: { key: "system_lockdown" },
      update: { value: "false" },
      create: { key: "system_lockdown", value: "false" },
    });
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to lift lockdown:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل إلغاء وضع الطوارئ",
    };
  }
}

export async function getLockdownStatus(): Promise<{
  success: boolean;
  isLockdown: boolean;
}> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "system_lockdown" },
    });
    return { success: true, isLockdown: setting?.value === "true" };
  } catch {
    return { success: true, isLockdown: false };
  }
}
