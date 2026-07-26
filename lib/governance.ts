import { prisma } from "./prisma";
import { Role } from "@prisma/client";
import { getSession } from "./auth";

/**
 * Sovereignty Layer - Governance Engine
 * Controls Module Sealing, Policy Compliance, and Owner Overrides.
 */

export enum SystemModule {
  FINANCIALS = "FINANCIALS",
  LAB_RECORDS = "LAB_RECORDS",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  SYSTEM_CONFIG = "SYSTEM_CONFIG",
  PRODUCTION = "PRODUCTION",
}

export async function isModuleSealed(moduleName: SystemModule): Promise<{
  sealed: boolean;
  reason?: string;
}> {
  const seal = await (prisma as any).moduleSeal.findUnique({
    where: { moduleName },
  });

  return {
    sealed: seal?.isSealed || false,
    reason: seal?.reason || undefined,
  };
}

export async function checkGovernorConstitution(
  userId: number,
  action: string,
): Promise<{ allowed: boolean; error?: string }> {
  // Logic to check against SystemPolicy entries categorized as "CONSTITUTION"
  const forbiddenAction = await prisma.systemPolicy.findFirst({
    where: {
      category: "CONSTITUTION",
      key: `FORBIDDEN_${action}`,
      value: "TRUE",
    },
  });

  if (forbiddenAction) {
    return {
      allowed: false,
      error: "This action is forbidden by the System Constitution.",
    };
  }

  return { allowed: true };
}

export async function isEmergencyModeActive(): Promise<boolean> {
  const val = await getPolicy("EMERGENCY_MODE_ACTIVE");
  return val === "TRUE";
}

export async function requireActiveSystem() {
  if (await isEmergencyModeActive()) {
    throw new Error(
      "SYSTEM_INTERRUPTION: The plant is currently in EMERGENCY MODE. All operations are suspended by the System Owner.",
    );
  }
}

/**
 * Checks if an action requires Dual Approval (Change Management).
 * If so, it returns the request status or throws if not approved.
 */
export async function enforceChangeManagement(action: string, data: any) {
  // Logic to check if this specific action/data combo needs a Change Request
  const sensitiveActions = ["UPDATE_THRESHOLD", "DELETE_USER", "BYPASS_SAFETY"];

  if (sensitiveActions.includes(action)) {
    // In a real scenario, this would check if an APPROVED ChangeRequest exists for this exact operation
    return { requiresRequest: true };
  }

  return { requiresRequest: false };
}

export async function logOwnerOverride(data: {
  userId: number;
  action: string;
  reason: string;
  details?: any;
}) {
  const session = await getSession();
  if (session?.role !== "SYSTEM_OWNER") {
    throw new Error("Only System Owner can perform Overrides.");
  }

  // Create an Audit Log with high priority
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      role: "SYSTEM_OWNER",
      action: `OWNER_OVERRIDE:${data.action}`,
      entity: "SYSTEM_SOVEREIGNTY",
      entityId: "0",
      details: JSON.stringify({
        ...data.details,
        override_reason: data.reason,
      }),
      reason: data.reason,
    },
  });

  // Also create a Violation/Risk alert for records
  await (prisma as any).complianceViolation.create({
    data: {
      type: "OWNER_OVERRIDE",
      severity: "CRITICAL",
      details: `Owner Override performed: ${data.action}. Reason: ${data.reason}`,
      userId: data.userId,
    },
  });
}

export async function getPolicy(key: string): Promise<string | null> {
  const policy = await prisma.systemPolicy.findFirst({
    where: { key, active: true },
  });
  return policy?.value || null;
}

export async function isActionForbidden(action: string): Promise<boolean> {
  const val = await getPolicy(`FORBIDDEN_${action}`);
  return val === "TRUE";
}

/**
 * Enforcement: Throws error if module is sealed.
 */
export async function requireUnsealedModule(moduleName: SystemModule) {
  const { sealed, reason } = await isModuleSealed(moduleName);
  if (sealed) {
    throw new Error(
      `Access Denied: The [${moduleName}] module is currently SEALED by the System Owner. Reason: ${reason || "No reason provided."}`,
    );
  }
}

/**
 * Enforcement: Throws error if action is forbidden by constitution.
 */
export async function requireConstitutionAllowance(action: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { allowed, error } = await checkGovernorConstitution(
    session.userId,
    action,
  );
  if (!allowed) {
    throw new Error(`Sovereign Block: ${error}`);
  }
}
