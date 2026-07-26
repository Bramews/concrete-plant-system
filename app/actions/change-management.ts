"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * Creates a formal Change Request that requires approval before being applied.
 * This is the core of versioned system control.
 */
export async function createChangeRequest(data: {
  title: string;
  description?: string;
  type: string;
  newData: any;
  originalData?: any;
}) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  const request = await prisma.changeRequest.create({
    data: {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      type: data.type,
      requesterId: session.userId,
      originalData: data.originalData
        ? JSON.stringify(data.originalData)
        : null,
      newData: JSON.stringify(data.newData),
      status: "PENDING",
    },
  });

  revalidatePath("/admin/sovereignty");
  return request;
}

/**
 * Approves and APPLYs a Change Request.
 * This is where the actual system state change happens.
 */
export async function approveAndApplyChange(requestId: string) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Change Request not found.");
  if (request.status !== "PENDING")
    throw new Error("Request is not in PENDING state.");

  // APPLY logic based on type
  const newData = JSON.parse(request.newData || "{}");

  await prisma.$transaction(async (tx) => {
    if (request.type === "POLICY_UPDATE") {
      await (tx as any).systemPolicy.update({
        where: { key: newData.key },
        data: { value: newData.value, version: { increment: 1 } },
      });
    } else if (request.type === "MODULE_SEAL") {
      await (tx as any).moduleSeal.update({
        where: { moduleName: newData.moduleName },
        data: { isSealed: newData.isSealed, reason: newData.reason },
      });
    }

    // Mark request as applied
    await tx.changeRequest.update({
      where: { id: requestId },
      data: {
        status: "APPLIED",
        approverId: session.userId,
        appliedAt: new Date(),
      },
    });

    // Versioning: Log the successful change as a major version event
    await tx.auditLog.create({
      data: {
        userId: session.userId,
        role: "SYSTEM_OWNER" as any,
        action: `CHANGE_APPLIED:${request.type}`,
        entity: "CHANGE_MANAGEMENT",
        entityId: "0",
        details: JSON.stringify({ requestId, title: request.title }),
        reason: "Sovereign Application",
      },
    });
  });

  revalidatePath("/admin/sovereignty");
  return { success: true };
}

/**
 * Rollback a specific Change Request.
 * Returns the system to the 'originalData' state.
 */
export async function rollbackChange(requestId: string) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "APPLIED") {
    throw new Error("Only applied changes can be rolled back.");
  }

  if (!request.originalData) {
    throw new Error("No original data found for rollback.");
  }

  const originalData = JSON.parse(request.originalData);

  await prisma.$transaction(async (tx) => {
    if (request.type === "POLICY_UPDATE") {
      await (tx as any).systemPolicy.update({
        where: { key: originalData.key },
        data: { value: originalData.value, version: { increment: 1 } },
      });
    } else if (request.type === "MODULE_SEAL") {
      await (tx as any).moduleSeal.update({
        where: { moduleName: originalData.moduleName },
        data: { isSealed: originalData.isSealed, reason: originalData.reason },
      });
    }

    // Mark request as rolled back
    await tx.changeRequest.update({
      where: { id: requestId },
      data: { status: "ROLLED_BACK" },
    });

    await tx.auditLog.create({
      data: {
        userId: session.userId,
        role: "SYSTEM_OWNER" as any,
        action: `ROLLBACK:${request.type}`,
        entity: "CHANGE_MANAGEMENT",
        entityId: "0",
        details: JSON.stringify({ requestId, title: request.title }),
        reason: "Sovereign Rollback",
      },
    });
  });

  revalidatePath("/admin/sovereignty");
  return { success: true };
}
