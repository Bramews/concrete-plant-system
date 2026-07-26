import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/logger";
import { setCompanySetting } from "@/lib/company-settings";

export async function exportCompanySettings(companyId: number) {
  const settings = await prisma.companySetting.findMany({
    where: { companyId },
    select: { key: true, value: true, lockType: true },
  });

  // Filter out sensitive logic if any (optional)

  return {
    companyId,
    exportedAt: new Date().toISOString(),
    settings: settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    ),
  };
}

export interface ImportPreviewResult {
  total: number;
  valid: number;
  locked: number;
  changes: Array<{
    key: string;
    oldValue: string;
    newValue: string;
    status: "PENDING" | "LOCKED" | "INVALID";
  }>;
}

export async function previewImportSettings(
  companyId: number,
  data: any,
): Promise<ImportPreviewResult> {
  if (!data.settings || typeof data.settings !== "object") {
    throw new Error("Invalid Export File Format");
  }

  const changes = [];
  let validCount = 0;
  let lockedCount = 0;

  for (const [key, value] of Object.entries(data.settings)) {
    const valStr = String(value);

    // Check Lock Status
    const sys = await prisma.systemSetting.findUnique({ where: { key } });
    if (sys?.lockType === "HARD" || sys?.lockType === "SOFT") {
      // Soft locked system settings require owner, but import might be by Admin?
      // If checking strict "Import Safety", we flag locked items.
      lockedCount++;
      changes.push({
        key,
        oldValue: "...",
        newValue: valStr,
        status: "LOCKED" as const,
      });
      continue;
    }

    const comp = await prisma.companySetting.findUnique({
      where: { companyId_key: { companyId, key } },
    });

    if (comp?.locked || comp?.lockType === "SOFT") {
      lockedCount++;
      changes.push({
        key,
        oldValue: comp.value,
        newValue: valStr,
        status: "LOCKED" as const,
      });
      continue;
    }

    validCount++;
    changes.push({
      key,
      oldValue: comp?.value || "(new)",
      newValue: valStr,
      status: "PENDING" as const,
    });
  }

  return {
    total: Object.keys(data.settings).length,
    valid: validCount,
    locked: lockedCount,
    changes,
  };
}

export async function applyImportSettings(
  companyId: number,
  data: any,
  userId: number,
  isSystemOwner: boolean,
) {
  if (!data.settings) throw new Error("Invalid Data");

  let successCount = 0;
  const errors = [];

  for (const [key, value] of Object.entries(data.settings)) {
    try {
      await setCompanySetting(
        companyId,
        key,
        String(value),
        userId,
        isSystemOwner,
      );
      successCount++;
    } catch (e: unknown) {
      errors.push({ key, error: (e as Error).message });
    }
  }

  await logEvent({
    action: "IMPORT_SETTINGS",
    entity: "Company",
    entityId: companyId,
    details: `Imported ${successCount} settings. Errors: ${errors.length}`,
    userId,
  });

  return { successCount, errors };
}
