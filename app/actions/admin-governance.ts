"use server";
import { getSession } from "@/lib/auth";
import { validateTenantIsolation } from "@/lib/db-guard";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// =======================
// SYSTEM OWNER GOVERNANCE
// =======================

export async function updateCompanyAccess(
  companyId: number,
  level: string,
  reason: string,
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  // STRICT: System Owner Only
  await requireRole(["SYSTEM_OWNER"]);

  if (!reason || reason.length < 5) {
    return {
      success: false,
      error: "Reason is mandatory and must be descriptive.",
    };
  }

  try {
    const prevCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { suspensionLevel: level },
    });

    // Mandatory Audit for Explainability Model
    await prisma.auditLog.create({
      data: {
        action: "GOVERNANCE_LEVEL_CHANGE",
        details: `Suspension Level changed from ${prevCompany?.suspensionLevel} to ${level}`,
        entity: "Company",
        entityId: String(companyId),
        userId: 1, // System Owner
        role: "SYSTEM_OWNER",
        reason: reason, // The "Why"
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/companies");
    return { success: true, message: `Access level updated to ${level}` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleCompanyFeature(
  companyId: number,
  featureKey: string,
  enabled: boolean,
) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  try {
    const existing = await prisma.companyFeature.findFirst({
      where: { companyId, key: featureKey },
    });

    if (existing) {
      await prisma.companyFeature.update({
        where: { id: existing.id },
        data: { enabled },
      });
    } else {
      await prisma.companyFeature.create({
        data: { companyId, key: featureKey, enabled },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: enabled ? "FEATURE_ENABLE" : "FEATURE_DISABLE",
        details: `Feature '${featureKey}' ${enabled ? "enabled" : "disabled"}`,
        entity: "CompanyFeature",
        entityId: String(companyId),
        userId: 1,
        role: "SYSTEM_OWNER",
        reason: "Manual Feature Toggle by System Owner",
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/companies");
    return { success: true, message: `Feature '${featureKey}' updated.` };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getGovernanceOverview(companyId: number) {
  const session = await getSession();
  if (session) {
    const isolationCheck = validateTenantIsolation(
      session.companyId,
      companyId,
      session.role,
    );
    if (!isolationCheck.valid) {
      throw new Error(isolationCheck.reason);
    }
  }

  await requireRole(["SYSTEM_OWNER"]);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      features: true,
      tenantHealth: true,
    },
  });

  if (!company) throw new Error("Company not found");

  const healthStatus = company.tenantHealth?.status;
  const healthScore =
    healthStatus === "HEALTHY"
      ? 100
      : healthStatus === "WARNING"
        ? 70
        : healthStatus === "CRITICAL"
          ? 30
          : 100;
  const healthBreakdown = company.tenantHealth?.details
    ? JSON.parse(company.tenantHealth.details)
    : [];

  return {
    suspensionLevel: company.suspensionLevel,
    features: company.features,
    healthScore,
    healthBreakdown,
  };
}
