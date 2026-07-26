"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { logEvent } from "@/lib/logger";
import { checkIdempotency, saveIdempotency } from "@/lib/locks";
import { revalidatePath } from "next/cache";
import { requireUnsealedModule, SystemModule } from "@/lib/governance";

const MaterialUpdateSchema = z.object({
  materialId: z.number().int().positive(),
  amount: z.number(),
  requestId: z.string().min(1),
});

const MaterialRejectionSchema = z.object({
  materialId: z.number().int().positive(),
  comments: z.string().min(1),
  requestId: z.string().min(1),
});

export async function updateMaterialStock(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["OPERATOR"]);
  await requireUnsealedModule(SystemModule.LAB_RECORDS); // Material stock is production/inventory

  const data = MaterialUpdateSchema.parse({
    materialId: parseInt(formData.get("materialId") as string),
    amount: parseFloat(formData.get("amount") as string),
    requestId: formData.get("requestId") as string,
  });

  const existing = await checkIdempotency(data.requestId);
  if (existing) return;

  try {
    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    // Security: Update only if material belongs to company
    const result = await prisma.material.updateMany({
      where: {
        id: data.materialId,
        companyId: user.companyId,
      },
      data: { stock: { increment: data.amount } },
    });

    if (result.count === 0) {
      throw new Error("Material not found or access denied");
    }

    await logEvent({
      action: "MATERIAL_STOCK_UPDATE",
      entity: "Material",
      entityId: data.materialId,
      requestId: data.requestId,
      startTime,
      details: `Updated stock by ${data.amount}.`,
    });

    await saveIdempotency(data.requestId, { success: true });
    revalidatePath("/materials");
  } catch (error: unknown) {
    throw new Error(`Stock update failure: ${(error as Error).message}`);
  }
}

export async function rejectMaterialBatch(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["LAB_TECH"]);
  await requireUnsealedModule(SystemModule.LAB_RECORDS);

  const data = MaterialRejectionSchema.parse({
    materialId: parseInt(formData.get("materialId") as string),
    comments: formData.get("comments") as string,
    requestId: formData.get("requestId") as string,
  });

  const existing = await checkIdempotency(data.requestId);
  if (existing) return;

  try {
    const user = await getCurrentUser();
    const dbUser = await prisma.user.findUnique({
      where: { username: user?.username || "" },
    });
    if (!dbUser) throw new Error("User session invalid");

    await prisma.materialRejection.create({
      data: {
        materialId: data.materialId,
        labUserId: dbUser.id,
        comments: data.comments,
        status: "PENDING",
      },
    });

    await logEvent({
      action: "MATERIAL_REJECTED_LAB",
      entity: "Material",
      entityId: data.materialId,
      requestId: data.requestId,
      startTime,
      details: `Lab Tech submitted rejection: ${data.comments}`,
    });

    await saveIdempotency(data.requestId, { success: true });
    revalidatePath("/materials");
  } catch (error: unknown) {
    throw new Error(
      `Rejection submission failure: ${(error as Error).message}`,
    );
  }
}

export async function acknowledgeMaterialRejection(formData: FormData) {
  const startTime = Date.now();
  await requireRole(["DEPARTMENT_MANAGER", "COMPANY_ADMIN"]);
  await requireUnsealedModule(SystemModule.LAB_RECORDS);

  const rejectionId = parseInt(formData.get("rejectionId") as string);
  const requestId = formData.get("requestId") as string;

  const existing = await checkIdempotency(requestId);
  if (existing) return;

  try {
    const user = await getCurrentUser();
    const dbUser = await prisma.user.findUnique({
      where: { username: user?.username || "" },
    });
    if (!dbUser) throw new Error("User session invalid");

    await prisma.materialRejection.update({
      where: { id: rejectionId },
      data: {
        status: "APPROVED",
        // managerApproval: true, // Removed: Field does not exist
        managerUserId: dbUser.id,
      },
    });

    await logEvent({
      action: "MATERIAL_REJECTION_ACKNOWLEDGED",
      entity: "MaterialRejection",
      entityId: rejectionId,
      requestId,
      startTime,
      details: "Manager acknowledged the rejection notification.",
    });

    await saveIdempotency(requestId, { success: true });
    revalidatePath("/materials");
  } catch (error: unknown) {
    throw new Error(
      `Manager acknowledgment failure: ${(error as Error).message}`,
    );
  }
}

export async function registerMaterialIntake(formData: FormData) {
  const startTime = Date.now();
  await requireRole([
    "DEPARTMENT_MANAGER",
    "COMPANY_ADMIN",
    "OPERATOR",
    "ACCOUNTANT",
  ]);
  await requireUnsealedModule(SystemModule.LAB_RECORDS);

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const materialId = parseInt(formData.get("materialId") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const reference = formData.get("reference") as string;
  const requestId = formData.get("requestId") as string;

  const existing = await checkIdempotency(requestId);
  if (existing) return;

  try {
    await prisma.$transaction([
      prisma.material.updateMany({
        where: {
          id: materialId,
          companyId: user.companyId, // Ensure we own the material
        },
        data: { stock: { increment: amount } },
      }),
      prisma.inventoryTransaction.create({
        data: {
          materialId,
          type: "IN",
          quantity: amount,
          reference,
          companyId: user.companyId, // Add missing relation
        },
      }),
    ]);

    await logEvent({
      action: "MATERIAL_INTAKE",
      entity: "Material",
      entityId: materialId,
      requestId,
      startTime,
      details: `Registered intake of ${amount} units. Ref: ${reference}`,
    });

    await saveIdempotency(requestId, { success: true });
    revalidatePath("/system/inventory/stock");
    return { success: true };
  } catch (error: unknown) {
    console.error("Intake Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
