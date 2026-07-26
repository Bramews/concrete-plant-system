import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";

// Standard Keys for Type Safety
export const SYSTEM_KEYS = {
  DEFAULT_PLAN_KEY: "BASIC",
  GRACE_PERIOD_DAYS: "7",
  ALERT_WARN_PERCENT: "80",
  ALERT_CRITICAL_PERCENT: "100",
  AUTO_SUSPEND_ENABLED: "true",
  SESSION_EXPIRY_DAYS: "7",
  RATE_LIMIT_PER_MINUTE: "120",
} as const;

export type SystemKey = keyof typeof SYSTEM_KEYS;

/**
 * Get System Setting with Type Safety and Default Fallback
 */
export async function getSystemSetting<T = string>(
  key: ConvertKeyParams,
  defaultValue?: T,
): Promise<T> {
  const settingKey = key as string;
  const setting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });

  if (!setting) {
    // If defaultValue provided, return it, else return generic default from const
    if (defaultValue !== undefined) return defaultValue;
    // Fallback to coded defaults if exist
    return (SYSTEM_KEYS[key as SystemKey] || "") as unknown as T;
  }

  // Value Casting
  const val = setting.value;
  if (val === "true") return true as unknown as T;
  if (val === "false") return false as unknown as T;
  if (!isNaN(Number(val)) && val.trim() !== "")
    return Number(val) as unknown as T;

  return val as unknown as T;
}

// Helper type to allow string input but suggest SystemKey
type ConvertKeyParams = SystemKey | (string & {});

/**
 * Set System Setting with Audit Log and Lock Check
 */
export async function setSystemSetting(
  key: ConvertKeyParams,
  value: string,
  userId: number,
) {
  const settingKey = key as string;

  // 1. Check Lock
  const existing = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });

  if (existing) {
    if (existing.lockType === "HARD") {
      throw new Error(`Setting ${settingKey} is HART LOCKED (Database Only).`);
    }
    // Soft Lock can be changed by System Owner (who is calling this function).
  }

  // 2. Upsert
  await prisma.systemSetting.upsert({
    where: { key: settingKey },
    update: { value, updatedAt: new Date() },
    create: { key: settingKey, value, updatedAt: new Date() },
  });

  // 3. Audit
  await logEvent({
    action: "UPDATE_SYSTEM_SETTING",
    entity: "SystemSetting",
    entityId: 0,
    details: `Key: ${settingKey}, Value: ${value}, Prev: ${existing?.value || "N/A"}`,
    userId: userId, // Explicit Attribution
  });
}
