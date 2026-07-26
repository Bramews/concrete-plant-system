"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logOwnerOverride } from "@/lib/governance";
import { revalidatePath } from "next/cache";

export async function getSovereignData() {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  // Fetch Module Seals
  const seals = await (prisma as any).moduleSeal.findMany();

  // Fetch System Policies
  const policies = await (prisma as any).systemPolicy.findMany();

  // Fetch System Health (Aggregated)
  const health = await (prisma as any).tenantHealth.findMany({
    include: { company: true },
  });

  // Fetch Risk Flags & Compliance Violations
  const risks = await prisma.systemAlert.findMany({
    where: { isRiskFlag: true, resolved: false },
    take: 10,
    orderBy: { timestamp: "desc" },
  });

  const violations = await (prisma as any).complianceViolation.findMany({
    where: { status: "OPEN" },
    take: 10,
    orderBy: { timestamp: "desc" },
  });

  // Fetch Recent Sovereignty Audit Logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "SYSTEM_SOVEREIGNTY" },
    take: 20,
    orderBy: { timestamp: "desc" },
  });

  // Fetch Change Requests (Recent)
  const changeRequests = await (prisma as any).changeRequest.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return {
    seals,
    policies,
    health,
    risks,
    violations,
    auditLogs,
    changeRequests,
  };
}

export async function toggleModuleSeal(
  moduleName: string,
  isSealed: boolean,
  reason: string,
) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  await (prisma as any).moduleSeal.update({
    where: { moduleName },
    data: {
      isSealed,
      reason,
      sealedBy: session.userId,
      sealedAt: isSealed ? new Date() : null,
    },
  });

  await logOwnerOverride({
    userId: session.userId,
    action: isSealed
      ? `SEAL_MODULE:${moduleName}`
      : `UNSEAL_MODULE:${moduleName}`,
    reason: reason,
  });

  revalidatePath("/admin/sovereignty");
  return { success: true };
}

export async function updateSystemPolicy(
  key: string,
  value: string,
  reason: string,
) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") throw new Error("Unauthorized");

  const policy = await (prisma as any).systemPolicy.findUnique({
    where: { key },
  });
  if (!policy) throw new Error("Policy not found.");

  // Phase 4 Clause 1.2: Check if this needs a formal Change Request (Dual Approval)
  if (policy.isLocked || policy.category === "CONSTITUTION") {
    const { createChangeRequest } = await import("./change-management");
    await createChangeRequest({
      title: `Update Policy: ${key}`,
      description: `Formal request to change ${key} to ${value}. Reason: ${reason}`,
      type: "POLICY_UPDATE",
      newData: { key, value },
      originalData: { key, value: policy.value },
    });
    return {
      success: true,
      message: "Change Request created for Dual Approval.",
    };
  }

  await (prisma as any).systemPolicy.update({
    where: { key },
    data: {
      value,
      version: policy.version + 1,
    },
  });

  await logOwnerOverride({
    userId: session.userId,
    action: `UPDATE_POLICY:${key}`,
    reason: reason,
    details: { prevValue: policy.value, newValue: value },
  });

  revalidatePath("/admin/sovereignty");
  return { success: true };
}
