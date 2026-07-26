import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Initializing Appendix A & B (Sovereignty Layer)...");

  const policies = [
    // APPENDIX A: SYSTEM SETTINGS
    {
      key: "PLANT_NAME",
      value: "Sovereign Concrete Alpha",
      category: "GENERAL",
    },
    {
      key: "PLANT_ADDRESS",
      value: "Industrial Zone 4, Sector B",
      category: "GENERAL",
    },
    { key: "PLANT_WORKING_HOURS", value: "06:00-18:00", category: "GENERAL" },
    { key: "SYSTEM_LANGUAGE_DEFAULT", value: "ar", category: "GENERAL" },

    // THRESHOLDS & ALERTS
    {
      key: "THRESHOLD_OVER_PRODUCTION",
      value: "5",
      category: "OPERATION",
      isLocked: true,
    },
    {
      key: "THRESHOLD_REJECTION_LIMIT",
      value: "10",
      category: "OPERATION",
      isLocked: true,
    },
    { key: "THRESHOLD_DELAY_LIMIT_MINS", value: "30", category: "OPERATION" },
    {
      key: "BLOCK_FLOW_ON_THRESHOLD_BREACH",
      value: "FALSE",
      category: "OPERATION",
    },

    // SYSTEM MODES
    {
      key: "MAINTENANCE_MODE_ACTIVE",
      value: "FALSE",
      category: "OPERATION",
      isLocked: true,
    },
    {
      key: "READ_ONLY_MODE_ACTIVE",
      value: "FALSE",
      category: "OPERATION",
      isLocked: true,
    },
    {
      key: "EMERGENCY_MODE_ACTIVE",
      value: "FALSE",
      category: "CONSTITUTION",
      isLocked: true,
    },

    // SYSTEM CONSTITUTION (FORBIDDEN FOREVER)
    {
      key: "FORBIDDEN_DELETE_AUDIT_LOGS",
      value: "TRUE",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "FORBIDDEN_CHANGE_ORIGINAL_QTY",
      value: "TRUE",
      category: "CONSTITUTION",
      isLocked: true,
    },
    {
      key: "FORBIDDEN_EDIT_LAB_RESULTS",
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
  ];

  for (const p of policies) {
    await prisma.systemPolicy.upsert({
      where: { key: p.key },
      update: {
        category: p.category,
        isLocked: p.isLocked ?? false,
      },
      create: {
        key: p.key,
        value: p.value,
        category: p.category,
        isLocked: p.isLocked ?? false,
      },
    });
  }

  // Ensure Module Seals Exist
  const modules = [
    "FINANCIALS",
    "LAB_RECORDS",
    "PRODUCTION",
    "USER_MANAGEMENT",
    "SYSTEM_CONFIG",
  ];
  for (const m of modules) {
    await prisma.moduleSeal.upsert({
      where: { moduleName: m },
      update: {},
      create: {
        moduleName: m,
        isSealed: false,
      },
    });
  }

  console.log("✅ Sovereignty Data Initialized.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
