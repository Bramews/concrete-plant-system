"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Fetch lab settings for the current company.
 */
export async function getLabSettings() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const settings = await prisma.companySetting.findMany({
      where: {
        companyId: user.companyId,
        key: {
          startsWith: "lab.",
        },
      },
    });

    // Convert to a clean object
    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key.replace("lab.", "")] = s.value;
    });

    return { success: true, data: config };
  } catch (error) {
    console.error("Error fetching lab settings:", error);
    return { success: false, error: "Failed to fetch lab settings" };
  }
}

/**
 * Update a specific lab setting.
 */
export async function updateLabSetting(key: string, value: string) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    await prisma.companySetting.upsert({
      where: {
        companyId_key: {
          companyId: user.companyId,
          key: `lab.${key}`,
        },
      },
      update: { value },
      create: {
        companyId: user.companyId,
        key: `lab.${key}`,
        value,
      },
    });

    revalidatePath("/system/lab/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating lab setting:", error);
    return { success: false, error: "Failed to update lab setting" };
  }
}

/**
 * Fetch standards accessible to the company (Global + Company specific).
 */
export async function getCompanyLabStandards() {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const standards = await prisma.labStandard.findMany({
      where: {
        OR: [
          { companyId: null }, // Global
          { companyId: user.companyId }, // Own
        ],
      },
      include: {
        testMethods: true,
      },
    });

    return { success: true, data: standards };
  } catch (error) {
    console.error("Error fetching company standards:", error);
    return { success: false, error: "Failed to fetch standards" };
  }
}

/**
 * Create a custom standard for the company.
 */
export async function createCompanyStandard(data: {
  code: string;
  name: string;
  organization: string;
  description?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !user.companyId) throw new Error("Unauthorized");

  try {
    const standard = await prisma.labStandard.create({
      data: {
        id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        ...data,
        companyId: user.companyId,
      },
    });

    revalidatePath("/system/lab/settings");
    return { success: true, data: standard };
  } catch (error) {
    console.error("Error creating company standard:", error);
    return { success: false, error: "Failed to create standard" };
  }
}
