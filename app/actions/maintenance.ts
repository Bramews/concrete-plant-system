"use server";

import { requireRole } from "@/lib/auth";
import { resetEquipmentMaintenance } from "@/lib/maintenance-engine";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function resetMaintenanceAction(equipmentId: number) {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);

  try {
    await resetEquipmentMaintenance(equipmentId);
    revalidatePath("/system/manager/maintenance");
    return { success: true };
  } catch (error) {
    console.error("Failed to reset maintenance:", error);
    return { error: "فشل إعادة تعيين عداد الصيانة" };
  }
}

export async function updateEquipmentMaintenanceConfig(
  equipmentId: number,
  trackingUnit: string,
  threshold: number,
) {
  await requireRole(["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"]);
  try {
    await prisma.equipmentMaintenance.upsert({
      where: { equipmentId },
      update: {
        trackingUnit,
        maintenanceThreshold: threshold,
      },
      create: {
        equipmentId,
        trackingUnit,
        maintenanceThreshold: threshold,
        batchCount: 0,
        status: "HEALTHY",
      },
    });
    revalidatePath("/system/manager/maintenance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update equipment maintenance config:", error);
    return { error: "فشل تحديث إعدادات الصيانة" };
  }
}
