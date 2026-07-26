"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

/**
 * Get all system settings
 */
export async function getSystemSettings() {
  await requireRole(["SYSTEM_OWNER"]);

  const settings = await prisma.systemSetting.findMany();

  // Convert to key-value object
  const settingsMap = settings.reduce(
    (acc, setting) => ({
      ...acc,
      [setting.key]: {
        value: setting.value,
        locked: setting.locked,
        lockType: setting.lockType,
      },
    }),
    {} as Record<string, { value: string; locked: boolean; lockType: string }>,
  );

  return settingsMap;
}

/**
 * Update a single system setting
 */
export async function updateSystemSetting(key: string, value: string) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // Check if setting is locked
    const existing = await prisma.systemSetting.findUnique({ where: { key } });

    if (existing?.locked && existing.lockType === "HARD") {
      return {
        error: "This setting is locked and cannot be modified",
        code: "SETTING_LOCKED",
      };
    }

    // Upsert the setting
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_SETTING_UPDATE",
        details: `Updated setting: ${key}`,
        entity: "SystemSetting",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    // Check for memory_limit update
    if (key === "memory_limit") {
      try {
        const newMemoryLimit = value;
        const startBatPath = path.join(process.cwd(), "START.bat");
        const restartBatPath = path.join(process.cwd(), "RESTART_SERVER.bat");

        if (fs.existsSync(startBatPath)) {
          let startBatContent = fs.readFileSync(startBatPath, "utf-8");
          startBatContent = startBatContent.replace(
            /set NODE_OPTIONS=--max-old-space-size=\d+/g,
            `set NODE_OPTIONS=--max-old-space-size=${newMemoryLimit}`,
          );
          fs.writeFileSync(startBatPath, startBatContent, "utf-8");
        }

        if (fs.existsSync(restartBatPath)) {
          let restartBatContent = fs.readFileSync(restartBatPath, "utf-8");
          restartBatContent = restartBatContent.replace(
            /set NODE_OPTIONS=--max-old-space-size=\d+/g,
            `set NODE_OPTIONS=--max-old-space-size=${newMemoryLimit}`,
          );
          fs.writeFileSync(restartBatPath, restartBatContent, "utf-8");

          // Trigger restart in background (detached)
          setTimeout(() => {
            exec("start cmd.exe /c RESTART_SERVER.bat", { cwd: process.cwd() });
          }, 1500);
        }
      } catch (e) {
        console.error("Failed to update bat files and restart", e);
      }
    }

    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (error) {
    console.error("Update system setting error:", error);
    return { error: "Failed to update setting" };
  }
}

/**
 * Update multiple system settings at once
 */
export async function updateSystemSettings(settings: Record<string, string>) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // Update all settings in parallel
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_SETTINGS_BULK_UPDATE",
        details: `Updated ${Object.keys(settings).length} settings`,
        entity: "SystemSetting",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    // Check for memory_limit update
    if (settings["memory_limit"]) {
      try {
        const newMemoryLimit = settings["memory_limit"];
        const startBatPath = path.join(process.cwd(), "START.bat");
        const restartBatPath = path.join(process.cwd(), "RESTART_SERVER.bat");

        if (fs.existsSync(startBatPath)) {
          let startBatContent = fs.readFileSync(startBatPath, "utf-8");
          startBatContent = startBatContent.replace(
            /set NODE_OPTIONS=--max-old-space-size=\d+/g,
            `set NODE_OPTIONS=--max-old-space-size=${newMemoryLimit}`,
          );
          fs.writeFileSync(startBatPath, startBatContent, "utf-8");
        }

        if (fs.existsSync(restartBatPath)) {
          let restartBatContent = fs.readFileSync(restartBatPath, "utf-8");
          restartBatContent = restartBatContent.replace(
            /set NODE_OPTIONS=--max-old-space-size=\d+/g,
            `set NODE_OPTIONS=--max-old-space-size=${newMemoryLimit}`,
          );
          fs.writeFileSync(restartBatPath, restartBatContent, "utf-8");

          // Trigger restart in background (detached)
          setTimeout(() => {
            exec("start cmd.exe /c RESTART_SERVER.bat", { cwd: process.cwd() });
          }, 1500);
        }
      } catch (e) {
        console.error("Failed to update bat files and restart", e);
      }
    }

    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (error) {
    console.error("Bulk update settings error:", error);
    return { error: "Failed to update settings" };
  }
}

/**
 * Reset a setting to its default value
 */
export async function resetSettingToDefault(key: string) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // Check if locked
    const existing = await prisma.systemSetting.findUnique({ where: { key } });

    if (existing?.locked && existing.lockType === "HARD") {
      return {
        error: "This setting is locked and cannot be reset",
        code: "SETTING_LOCKED",
      };
    }

    // Delete the setting (system will use default)
    await prisma.systemSetting.delete({ where: { key } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_SETTING_RESET",
        details: `Reset setting to default: ${key}`,
        entity: "SystemSetting",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/settings/system");
    return { success: true };
  } catch (error) {
    console.error("Reset setting error:", error);
    return { error: "Failed to reset setting" };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(toEmail: string) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    // Get SMTP settings
    const settings = await getSystemSettings();

    const smtpHost = settings.smtp_host?.value;
    const smtpPort = parseInt(settings.smtp_port?.value || "587");
    const smtpUser = settings.smtp_username?.value;
    const smtpPass = settings.smtp_password?.value;
    const smtpFrom = settings.smtp_from_email?.value;
    const smtpFromName = settings.smtp_from_name?.value || "System";
    const smtpSecure = settings.smtp_secure?.value === "true";

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return {
        error:
          "Missing SMTP configuration. Please configure email settings first.",
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpFrom}>`,
      to: toEmail,
      subject: "Test Email from Concrete Plant System",
      text: "This is a test email to verify your SMTP settings.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2563eb;">Test Email</h2>
          <p>This is a test email to verify your SMTP settings.</p>
          <p>If you received this message, your email configuration is working correctly.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Sent from Concrete Plant System</p>
        </div>
      `,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "TEST_EMAIL_SENT",
        details: `Test email sent to: ${toEmail}`,
        entity: "Email",
        entityId: "0",
        userId: 1, // Generic system user or grab from session if available
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    return { success: true, message: "Test email sent successfully" };
  } catch (error: any) {
    console.error("Send test email error:", error);
    return { error: error.message || "Failed to send test email" };
  }
}

export async function toggleSystemSettingLock(key: string, locked: boolean) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const setting = await prisma.systemSetting.update({
      where: { key },
      data: { locked },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_SETTING_LOCK_TOGGLE",
        details: `Toggled lock status for setting ${key} to ${locked}`,
        entity: "SystemSetting",
        entityId: "0",
        userId: 1,
        role: "SYSTEM_OWNER",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/settings/system");
    return { success: true, setting };
  } catch (error) {
    console.error("Toggle system setting lock error:", error);
    return { error: "Failed to toggle setting lock" };
  }
}
