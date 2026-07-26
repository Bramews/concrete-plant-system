"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function updateSystemSettings(data: Record<string, string>) {
  try {
    const updates = Object.entries(data).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );

    await prisma.$transaction(updates);
    revalidatePath("/", "layout"); // Revalidate everything as Sidebar is global
    return { success: true };
  } catch (error) {
    console.error("Failed to update system settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function getGlobalAppearance() {
  const settings = await getSystemSettings();
  return {
    style: settings.style || "comfortable-future",
    theme: settings.theme || "dark-comfortable-future",
  };
}

export async function updateSystemSettingAction(key: string, value: string) {
  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    revalidatePath("/", "layout");
    return { success: true, setting };
  } catch (error) {
    console.error(`Failed to update setting ${key}:`, error);
    throw new Error("Failed to update setting");
  }
}

export async function toggleSystemSettingLockAction(
  key: string,
  locked: boolean,
) {
  try {
    const setting = await prisma.systemSetting.update({
      where: { key },
      data: { locked },
    });
    revalidatePath("/", "layout");
    return { success: true, setting };
  } catch (error) {
    console.error(`Failed to toggle lock for setting ${key}:`, error);
    throw new Error("Failed to toggle lock");
  }
}

export async function exportSettingsAction() {
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export async function previewImportAction(parsed: Record<string, string>) {
  const existing = await prisma.systemSetting.findMany();
  const existingMap = existing.reduce(
    (acc, s) => {
      acc[s.key] = s;
      return acc;
    },
    {} as Record<string, { value: string; locked: boolean }>,
  );

  let total = 0;
  let valid = 0;
  let locked = 0;
  const changes: {
    key: string;
    oldValue: string;
    newValue: string;
    status: "LOCKED" | "OK";
  }[] = [];

  for (const [key, newValue] of Object.entries(parsed)) {
    total++;
    const ext = existingMap[key];
    const isLocked = ext?.locked || false;

    if (isLocked) {
      locked++;
      changes.push({
        key,
        oldValue: ext?.value || "",
        newValue,
        status: "LOCKED",
      });
    } else {
      valid++;
      changes.push({
        key,
        oldValue: ext?.value || "",
        newValue,
        status: "OK",
      });
    }
  }

  return {
    total,
    valid,
    locked,
    changes,
  };
}

export async function applyImportAction(parsed: Record<string, string>) {
  const existing = await prisma.systemSetting.findMany();
  const lockedKeys = new Set(
    existing.filter((s) => s.locked).map((s) => s.key),
  );

  const updates = Object.entries(parsed)
    .filter(([key]) => !lockedKeys.has(key))
    .map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  revalidatePath("/", "layout");
  return { success: true };
}
