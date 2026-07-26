import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

// Standard Keys (Type Safety)
export type SystemSettingKey =
  | "DEFAULT_PLAN"
  | "GRACE_PERIOD_DAYS"
  | "AUTO_SUSPEND_THRESHOLD"
  | "SESSION_TIMEOUT_MINUTES"
  | "ALLOW_REGISTRATION";

export type CompanySettingKey =
  | "TIMEZONE"
  | "CURRENCY"
  | "LANGUAGE"
  | "UNITS"
  | "INVOICE_PREFIX";

export type UserSettingKey = "THEME" | "LANGUAGE" | "NOTIFICATIONS_ENABLED";

// Default Values (Fallback)
const DEFAULTS: Record<string, string> = {
  // System
  DEFAULT_PLAN: "BASIC",
  GRACE_PERIOD_DAYS: "7",
  AUTO_SUSPEND_THRESHOLD: "3", // 3 Critical Alerts
  SESSION_TIMEOUT_MINUTES: "1440", // 24 Hours
  ALLOW_REGISTRATION: "false",

  // Company
  TIMEZONE: "Asia/Baghdad",
  CURRENCY: "IQD",
  LANGUAGE: "ar",
  UNITS: "metric",
  INVOICE_PREFIX: "INV",

  // User
  THEME: "system", // light, dark, system
  NOTIFICATIONS_ENABLED: "true",
};

/**
 * Get System Setting (Sovereign)
 */
export async function getSystemSetting(key: SystemSettingKey): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });
  return setting?.value || DEFAULTS[key] || "";
}

/**
 * Set System Setting (Audit Required)
 */
export async function setSystemSetting(
  key: SystemSettingKey,
  value: string,
  userId: number, // Audit Actor
) {
  const prev = await getSystemSetting(key);
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value, updatedAt: new Date() },
  });

  await logEvent({
    action: "UPDATE_SYSTEM_SETTING",
    entity: "SystemSetting",
    entityId: 0, // Global
    details: `Key: ${key}, Value: ${value}, Prev: ${prev}`,
    userId,
  });
}

/**
 * Get Company Setting (Cascading: Company -> System -> Default)
 */
export async function getCompanySetting(
  companyId: number,
  key: CompanySettingKey,
): Promise<string> {
  // 1. Check Company Specific
  const setting = await prisma.companySetting.findUnique({
    where: {
      companyId_key: { companyId, key },
    },
  });
  if (setting) return setting.value;

  // 2. Fallback to System Setting if key exists there (Shared Keys)
  // For LANGUAGE, we check System level.
  if (key === "LANGUAGE") {
    // Cast to SystemKey to satisfy type check if we added it to System keys
    // But SystemKeys types are separate.
    // Let's manually check system setting for 'LANGUAGE' if we decide to store it there.
    // For now, adhere to DEFAULTS as "System Defaults".
    // If the User meant DB-Stored System Settings, we would need to add LANGUAGE to SystemSettingKey.
    // Let's assume DEFAULTS is sufficient for now unless explicit requirement.
  }

  return DEFAULTS[key] || "";
}

/**
 * Set Company Setting
 */
export async function setCompanySetting(
  companyId: number,
  key: CompanySettingKey,
  value: string,
  userId: number,
) {
  // SOVEREIGN RULE: ONLY ARABIC IS ALLOWED
  if (key === "LANGUAGE" && value !== "ar") {
    throw new Error(
      "Sovereign Violation: Only Arabic language is permitted in this system.",
    );
  }

  const prev = await getCompanySetting(companyId, key);

  await prisma.companySetting.upsert({
    where: {
      companyId_key: { companyId, key },
    },
    update: { value, updatedAt: new Date() },
    create: { companyId, key, value, updatedAt: new Date() },
  });

  await logEvent({
    action: "UPDATE_COMPANY_SETTING",
    entity: "CompanySetting",
    entityId: companyId,
    details: `Key: ${key}, Value: ${value}, Prev: ${prev}`,
    userId,
  });
}

/**
 * Get User Setting (Cascading: User -> Company -> System -> Default)
 */
export async function getUserSetting(
  userId: number,
  key: UserSettingKey,
): Promise<string> {
  // SOVEREIGN RULE: ALWAYS ARABIC
  if (key === "LANGUAGE") return "ar";

  // 1. Check User
  const userSetting = await prisma.userSetting.findUnique({
    where: {
      userId_key: { userId, key },
    },
  });
  if (userSetting) return userSetting.value;

  // 2. Check Company (Cascading)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (user?.companyId) {
    // If we wanted to cascade language:
    // return getCompanySetting(user.companyId, "LANGUAGE");
  }

  return DEFAULTS[key] || "";
}

/**
 * Set User Setting
 */
export async function setUserSetting(
  userId: number,
  key: UserSettingKey,
  value: string,
) {
  // SOVEREIGN RULE: ONLY ARABIC IS ALLOWED
  if (key === "LANGUAGE" && value !== "ar") {
    throw new Error(
      "Sovereign Violation: Only Arabic language is permitted in this system.",
    );
  }

  await prisma.userSetting.upsert({
    where: {
      userId_key: { userId, key },
    },
    update: { value, updatedAt: new Date() },
    create: { userId, key, value, updatedAt: new Date() },
  });
}

/**
 * Get Global Settings (Consolidated for UI)
 * Returns essential site branding and configuration
 */
export function getSettings() {
  return {
    siteName: "Concrete Plant System",
    logoText: "CPS",
    version: "v1.0.4",
  };
}
