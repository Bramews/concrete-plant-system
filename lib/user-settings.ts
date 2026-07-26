import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { getCompanySetting } from "@/lib/company-settings";
import { getSystemSetting } from "@/lib/system-settings";

// Allowed Keys
export const USER_KEYS = {
  // UI / UX
  THEME: "light", // light, dark, system
  LANGUAGE: "ar",

  // Notifications
  NOTIFY_EMAIL: "true",
  NOTIFY_IN_APP: "true",

  // Dashboard
  DEFAULT_DASHBOARD_TAB: "overview",
} as const;

export type UserKey = keyof typeof USER_KEYS;

/**
 * Get User Setting
 * Priority: System (Locked) -> Company (Locked) -> User -> Company (Value) -> System (Value) -> Default
 */
export async function getUserSetting<T = string>(
  userId: number,
  key: ConvertKeyParams,
  defaultValue?: T,
): Promise<T> {
  const settingKey = key as string;

  // 0. Resolve User Context (CompanyId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  // 1. Check System Lock (Supreme Authority)
  const sysSetting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });
  if (sysSetting?.locked) {
    return castValue(sysSetting.value) as unknown as T;
  }

  // 2. Check Company Lock (Organization Authority)
  if (user?.companyId) {
    const compSetting = await prisma.companySetting.findUnique({
      where: {
        companyId_key: { companyId: user.companyId, key: settingKey },
      },
    });
    if (compSetting?.locked) {
      return castValue(compSetting.value) as unknown as T;
    }
  }

  // 3. User Preference (Individual Choice)
  const userSetting = await prisma.userSetting.findUnique({
    where: {
      userId_key: { userId, key: settingKey },
    },
  });

  if (userSetting) {
    return castValue(userSetting.value) as unknown as T;
  }

  // 4. Fallback Chain
  // If User hasn't set it, fall back to Company Default -> System Default -> Code Default
  if (user?.companyId) {
    // We use getCompanySetting to handle the Company->System cascade
    // We pass the code default here.
    const fallbackDefault =
      defaultValue !== undefined
        ? defaultValue
        : ((USER_KEYS[key as UserKey] || "") as unknown as T);

    // Note: getCompanySetting already checks Company -> System.
    return getCompanySetting<T>(user.companyId, key, fallbackDefault);
  } else {
    // No Company (e.g. System Admin or Orphan), Fallback to System -> Default
    return getSystemSetting<T>(
      settingKey,
      (defaultValue ?? (USER_KEYS[key as UserKey] || "")) as unknown as T,
    );
  }
}

// Helper type
type ConvertKeyParams = UserKey | (string & {});

function castValue(val: string) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
  return val;
}

/**
 * Set User Setting
 */
export async function setUserSetting(
  userId: number,
  key: ConvertKeyParams,
  value: string,
) {
  const settingKey = key as string;

  // 1. Check Enforcement (Cannot override Locked Settings)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  // Check System Lock
  const sysSetting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });
  if (sysSetting?.locked) {
    throw new Error(
      `Setting ${settingKey} is enforced by System and cannot be changed.`,
    );
  }

  // Check Company Lock
  if (user?.companyId) {
    const compSetting = await prisma.companySetting.findUnique({
      where: {
        companyId_key: { companyId: user.companyId, key: settingKey },
      },
    });
    if (compSetting?.locked) {
      throw new Error(
        `Setting ${settingKey} is enforced by Company and cannot be changed.`,
      );
    }
  }

  // 2. Upsert
  const existing = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: settingKey } },
  });

  await prisma.userSetting.upsert({
    where: {
      userId_key: { userId, key: settingKey },
    },
    update: { value, updatedAt: new Date() },
    create: { userId, key: settingKey, value, updatedAt: new Date() },
  });

  // 3. Audit
  await logEvent({
    action: "UPDATE_USER_SETTING",
    entity: "UserSetting",
    entityId: userId,
    details: `Key: ${settingKey}, Value: ${value}, Prev: ${existing?.value || "N/A"}`,
    userId,
  });
}
