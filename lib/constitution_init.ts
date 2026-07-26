import { prisma } from "./prisma";
import { SystemModule } from "./governance";

/**
 * Initialize core constitution rules and module seals.
 * This ensures the system starts in a 'Regulated' state.
 */
export async function initializeConstitution() {
  const corePolicies = [
    {
      key: "FORBIDDEN_DELETE_AUDIT_LOGS",
      value: "TRUE",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "FORBIDDEN_DATABASE_WIPE",
      value: "TRUE",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "EMERGENCY_MODE_ACTIVE",
      value: "FALSE",
      category: "OPERATION",
      isLocked: true,
    },
    {
      key: "SYSTEM_LANGUAGE_SOVEREIGNTY",
      value: "ARABIC_ENFORCED",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "SYSTEM_STABILITY_PROTOCOL",
      value: "ACTIVE",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "AI_AGENT_STATUS",
      value: "PASSIVE", // Default safe mode
      category: "AI_CONTROL",
      isLocked: false,
    },
    {
      key: "AUTO_FIX_ENABLED",
      value: "false", // Must be false by default
      category: "AI_CONTROL",
      isLocked: false,
    },
    {
      key: "MIN_ORDER_THRESHOLD_KG",
      value: "500",
      category: "OPERATION",
      isLocked: false,
    },
  ];

  for (const policy of corePolicies) {
    await prisma.systemSetting.upsert({
      where: { key: policy.key },
      update: {},
      create: {
        key: policy.key,
        value: policy.value,
        locked: policy.isLocked,
        lockType: policy.category === "CONSTITUTION" ? "HARD" : "NONE",
        updatedAt: new Date(),
      },
    });
  }

  // Initial Module Sealing (All open by default but defined)
  const modules = Object.values(SystemModule);
  for (const moduleName of modules) {
    await (prisma as any).moduleSeal.upsert({
      where: { moduleName },
      update: {},
      create: {
        moduleName,
        isSealed: false,
      },
    });
  }

  console.log("System Constitution Initialized.");
}
