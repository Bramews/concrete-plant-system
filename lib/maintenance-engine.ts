import { prisma } from "@/lib/prisma";

/**
 * Recalculates the health status of a piece of equipment based on its batch count and threshold.
 */
export function calculateHealthStatus(
  batchCount: number,
  threshold: number,
): "HEALTHY" | "WARNING" | "CRITICAL" | "OVERDUE" {
  if (threshold <= 0) return "HEALTHY";
  const percentage = (batchCount / threshold) * 100;
  if (percentage < 70) return "HEALTHY";
  if (percentage < 90) return "WARNING";
  if (percentage < 100) return "CRITICAL";
  return "OVERDUE";
}

/**
 * Increments batch count counters for all equipment in a company and updates their health status.
 */
export async function trackBatchProduction(companyId: number) {
  // Find all equipment for this company
  const equipmentList = await prisma.equipment.findMany({
    where: { companyId },
  });

  for (const eq of equipmentList) {
    // Find or create EquipmentMaintenance record
    let maintenance = await prisma.equipmentMaintenance.findUnique({
      where: { equipmentId: eq.id },
    });

    if (!maintenance) {
      maintenance = await prisma.equipmentMaintenance.create({
        data: {
          equipmentId: eq.id,
          batchCount: 0,
          maintenanceThreshold: 1000, // default threshold
          status: "HEALTHY",
        },
      });
    }

    const nextCount = maintenance.batchCount + 1;
    const nextStatus = calculateHealthStatus(
      nextCount,
      maintenance.maintenanceThreshold,
    );

    await prisma.equipmentMaintenance.update({
      where: { id: maintenance.id },
      data: {
        batchCount: nextCount,
        status: nextStatus,
      },
    });

    // If status changed to WARNING or higher, we can log an event or create a system alert
    if (nextStatus !== maintenance.status && nextStatus !== "HEALTHY") {
      // Log event
      await prisma.auditLog.create({
        data: {
          action: "EQUIPMENT_WARNING",
          details: `Equipment "${eq.name}" entered state ${nextStatus} (Batches: ${nextCount}/${maintenance.maintenanceThreshold})`,
          entity: "Equipment",
          entityId: String(eq.id),
          companyId,
          role: "SYSTEM",
          timestamp: new Date(),
        },
      });
    }
  }
}

/**
 * Resets the maintenance counters for a specific equipment (e.g. after a repair).
 */
export async function resetEquipmentMaintenance(equipmentId: number) {
  const maintenance = await prisma.equipmentMaintenance.findUnique({
    where: { equipmentId },
  });

  if (maintenance) {
    await prisma.equipmentMaintenance.update({
      where: { id: maintenance.id },
      data: {
        batchCount: 0,
        status: "HEALTHY",
        lastMaintenanceDate: new Date(),
      },
    });

    // Update main equipment record lastMaintenance timestamp too
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        lastMaintenance: new Date(),
      },
    });
  }
}
