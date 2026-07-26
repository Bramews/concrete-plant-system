const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function initializeConstitution() {
  console.log("Starting Sovereign Constitution Initialization...");

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
      key: "MIN_ORDER_THRESHOLD_KG",
      value: "500",
      category: "OPERATION",
      isLocked: false,
    },
  ];

  try {
    for (const policy of corePolicies) {
      await prisma.systemPolicy.upsert({
        where: { key: policy.key },
        update: {},
        create: {
          ...policy,
          updatedAt: new Date(),
        },
      });
    }

    const modules = [
      "FINANCIALS",
      "LAB_RECORDS",
      "USER_MANAGEMENT",
      "SYSTEM_CONFIG",
    ];
    for (const moduleName of modules) {
      await prisma.moduleSeal.upsert({
        where: { moduleName },
        update: {},
        create: {
          moduleName,
          isSealed: false,
        },
      });
    }

    console.log("Success: Sovereign Constitution Initialized.");
  } catch (error) {
    console.error("Initialization Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeConstitution();
