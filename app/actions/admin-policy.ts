"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// =======================
// POLICY ENGINE
// =======================

export async function publishPolicyVersion(
  key: string,
  rules: string,
  reason: string,
) {
  await requireRole(["SYSTEM_OWNER"]);

  if (!reason) throw new Error("Reason required for policy change.");

  try {
    // 1. Get current version to increment
    const current = await prisma.systemPolicy.findFirst({
      where: { key },
      orderBy: { version: "desc" },
    });

    const newVersion = (current?.version || 0) + 1;

    // 2. Archive old ones? No, just set active=false if we want single active.
    // Directive says "Versioned". We probably want to mark *one* as active.

    // Deactivate previous
    await prisma.systemPolicy.updateMany({
      where: { key, active: true },
      data: { active: false },
    });

    // 3. Create new version
    const policy = await prisma.systemPolicy.create({
      data: {
        key,
        version: newVersion,
        value: rules,
        active: true,
      },
    });

    // 4. Audit
    await prisma.auditLog.create({
      data: {
        action: "POLICY_PUBLISH",
        details: `Policy ${key} updated to v${newVersion}`,
        entity: "SystemPolicy",
        entityId: String(policy.id),
        userId: 1, // System Owner
        role: "SYSTEM_OWNER",
        reason: reason,
        policyVersion: newVersion,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/governance/policies");
    return {
      success: true,
      message: `Policy ${key} v${newVersion} published.`,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function rollbackPolicy(
  key: string,
  targetVersion: number,
  reason: string,
) {
  await requireRole(["SYSTEM_OWNER"]);

  try {
    const target = await prisma.systemPolicy.findUnique({
      where: { key_version: { key, version: targetVersion } },
    });

    if (!target) throw new Error("Target version not found.");

    // Deactivate all
    await prisma.systemPolicy.updateMany({
      where: { key },
      data: { active: false },
    });

    // Activate target
    await prisma.systemPolicy.update({
      where: { id: target.id },
      data: { active: true },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        action: "POLICY_ROLLBACK",
        details: `Policy ${key} rolled back to v${targetVersion}`,
        entity: "SystemPolicy",
        entityId: String(target.id),
        userId: 1,
        role: "SYSTEM_OWNER",
        reason: reason,
        policyVersion: targetVersion,
        timestamp: new Date(),
      },
    });

    revalidatePath("/admin/governance/policies");
    return {
      success: true,
      message: `Rollback to v${targetVersion} successful.`,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
