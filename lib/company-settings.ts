import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { getSystemSetting } from "@/lib/system-settings";

// Standard Keys
export const COMPANY_KEYS = {
  // Localization
  TIMEZONE: "Asia/Baghdad",
  LANGUAGE: "ar",
  CURRENCY: "IQD",
  UNITS: "metric",

  // Branding
  BRAND_NAME: "",
  BRAND_LOGO_URL: "",
  BRAND_PRIMARY_COLOR: "#000000",

  // Behavior
  ALLOW_USER_INVITES: "true",
  ALLOW_API_ACCESS: "false",
} as const;

export type CompanyKey = keyof typeof COMPANY_KEYS;

/**
 * Get Company Setting (Cascading: Company -> System -> Default)
 */
export async function getCompanySetting<T = string>(
  companyId: number,
  key: ConvertKeyParams,
  defaultValue?: T,
): Promise<T> {
  const settingKey = key as string;

  // 1. Check Company Level
  const setting = await prisma.companySetting.findUnique({
    where: {
      companyId_key: { companyId, key: settingKey },
    },
  });

  if (setting) {
    return castValue(setting.value) as unknown as T;
  }

  // 2. Check System Level (Sovereignty Fallback)
  // Some keys might exist in System Settings with the same name?
  // If not, we fall back to Code Defaults.
  // Currently System Settings has keys like DEFAULT_PLAN, GRACE...
  // But maybe we want to allow System Defaults for "LANGUAGE"?
  // For strictness, if it's not in System Keys, we skip or try.

  // Note: getSystemSetting returns default from code if DB missing.
  // But our System Keys are strictly defined.
  // If 'key' matches a SystemKey, we use it. If not, we use COMPANY_KEYS default.

  // Implementation Decision: Use COMPANY_KEYS defaults for now,
  // unless we explicitly added these to System Keys (we haven't yet).
  if (defaultValue !== undefined) return defaultValue;
  return (COMPANY_KEYS[key as CompanyKey] || "") as unknown as T;
}

// Helper type
type ConvertKeyParams = CompanyKey | (string & {});

function castValue(val: string) {
  if (val === "true") return true;
  if (val === "false") return false;
  if (!isNaN(Number(val)) && val.trim() !== "") return Number(val);
  return val;
}

/**
 * Set Company Setting
 */
export async function setCompanySetting(
  companyId: number,
  key: ConvertKeyParams,
  value: string,
  userId: number,
  isSystemOwner: boolean = false,
) {
  const settingKey = key as string;

  // 1. Check System Lock (Sovereignty)
  const sysSetting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
  });

  if (sysSetting) {
    if (sysSetting.lockType === "HARD") {
      throw new Error(`Setting ${settingKey} is HARD LOCKED by System.`);
    }
    if (sysSetting.lockType === "SOFT") {
      // Soft Lock: Only System Owner can override.
      if (!isSystemOwner) {
        throw new Error(
          `Setting ${settingKey} is LOCKED by System (Owner Access Required).`,
        );
      }
    }
    if (sysSetting.lockType === "PLAN") {
      // Validation for Plan Lock would go here.
      // For now, warning or block if not upgraded.
      // Assuming strict blocking if key implies plan feature.
    }
  }

  // 2. Check Existing Company Lock (Local Lock)
  // If a setting was locked LOCALLY (e.g. by System Owner for this specific company),
  // then Admin cannot change it.
  const existing = await prisma.companySetting.findUnique({
    where: {
      companyId_key: { companyId, key: settingKey },
    },
  });

  if (existing?.locked || existing?.lockType === "SOFT") {
    if (!isSystemOwner) {
      throw new Error(`Setting ${settingKey} is LOCALLY LOCKED.`);
    }
  }

  // 2. Upsert
  await prisma.companySetting.upsert({
    where: {
      companyId_key: { companyId, key: settingKey },
    },
    update: { value },
    create: { companyId, key: settingKey, value, locked: false },
  });

  // 3. Audit
  await logEvent({
    action: "UPDATE_COMPANY_SETTING",
    entity: "CompanySetting",
    entityId: companyId,
    details: `Key: ${settingKey}, Value: ${value}, Prev: ${existing?.value || "N/A"}`,
    userId,
  });
}

/**
 * Lock Company Setting (System Owner Only)
 */
export async function lockCompanySetting(
  companyId: number,
  key: ConvertKeyParams,
  locked: boolean,
  userId: number, // Must be System Owner
) {
  const settingKey = key as string;
  // Verify user is System Owner (Caller responsibility or check Role?)
  // We assume Caller checks permissions.

  await prisma.companySetting.update({
    where: {
      companyId_key: { companyId, key: settingKey },
    },
    data: { locked },
  });

  await logEvent({
    action: "LOCK_COMPANY_SETTING",
    entity: "CompanySetting",
    entityId: companyId,
    details: `Key: ${settingKey}, Locked: ${locked}`,
    userId,
  });
}
