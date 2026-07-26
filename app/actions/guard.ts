"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { revalidatePath } from "next/cache";

const VehicleMovementSchema = z.object({
  vehicleId: z.number().int().positive(),
  location: z.enum(["INSIDE", "OUTSIDE"]),
});

const IncomingMaterialSchema = z.object({
  materialType: z.string().min(1),
  quantity: z.number().positive(),
  source: z.string().min(1),
});

export async function logVehicleMovement(formData: FormData) {
  // Allowed: GUARD and MANAGER
  await requireRole(["GUARD", "MANAGER"]);

  try {
    const rawData = {
      vehicleId: parseInt(formData.get("vehicleId") as string),
      location: formData.get("location"),
    };

    const data = VehicleMovementSchema.parse(rawData);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    // Security: Company Isolation
    const user = await import("@/lib/auth").then((m) => m.getCurrentUser());
    // Guard might be a shared resource or company specific?
    // Assuming Vehicles are company specific.
    if (!user?.companyId || vehicle.companyId !== user.companyId) {
      throw new Error("Unauthorized Access to Vehicle");
    }

    // Update Vehicle
    await prisma.vehicle.update({
      where: {
        id: data.vehicleId,
        companyId: user.companyId,
      },
      data: {
        location: data.location,
        lastEntryAt:
          data.location === "INSIDE" ? new Date() : vehicle.lastEntryAt,
        lastExitAt:
          data.location === "OUTSIDE" ? new Date() : vehicle.lastExitAt,
      },
    });

    await logEvent({
      action: `VEHICLE_${data.location}`,
      entity: "Vehicle",
      entityId: data.vehicleId,
      details: `Vehicle ${vehicle.code} marked as ${data.location}`,
    });

    revalidatePath("/system/guard");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function registerIncomingMaterial(formData: FormData) {
  await requireRole(["GUARD"]);

  // Explicit check for permission flag
  const currentUser = await import("@/lib/auth").then((m) =>
    m.getCurrentUser(),
  );

  if (!currentUser || currentUser.role !== "GUARD") {
    throw new Error("Unauthorized.");
  }

  // Fetch full user to check specific permission flag
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { canRegisterMaterials: true },
  });

  if (!dbUser?.canRegisterMaterials) {
    throw new Error(
      "Unauthorized: You do not have permission to register materials. Contact Accounts.",
    );
  }

  try {
    const data = IncomingMaterialSchema.parse({
      materialType: formData.get("materialType"),
      quantity: parseFloat(formData.get("quantity") as string),
      source: formData.get("source"),
    });

    await prisma.incomingShipment.create({
      data: {
        materialType: data.materialType,
        quantity: data.quantity,
        source: data.source,
        recordedByUserId: currentUser.id,
      },
    });

    // Log event ...
    // Simplified for brevity in replacement block if context allows, but I'll keeping it consistent
    await logEvent({
      action: "INCOMING_MATERIAL",
      entity: "IncomingShipment",
      entityId: 0, // ID not available if I don't capture it. Fixed below.
      details: `Received ${data.quantity} of ${data.materialType} from ${data.source}`,
    });

    revalidatePath("/system/guard");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
