import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Aggregate Standards...");

  // 1. ASTM C127 - Specific Gravity & Absorption (Coarse)
  const c127 = await prisma.labStandard.upsert({
    where: { code: "ASTM C127" },
    update: {},
    create: {
      code: "ASTM C127",
      name: "Standard Test Method for Relative Density (Specific Gravity) and Absorption of Coarse Aggregate",
      organization: "ASTM",
      description: "Measure density and absorption of coarse aggregates",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: c127.id,
        code: "SG_COARSE",
      },
    },
    update: {},
    create: {
      standardId: c127.id,
      name: "Specific Gravity (Coarse)",
      code: "SG_COARSE",
      unit: "OD",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: c127.id,
        code: "ABS_COARSE",
      },
    },
    update: {},
    create: {
      standardId: c127.id,
      name: "Absorption (Coarse)",
      code: "ABS_COARSE",
      unit: "%",
      warningMax: 2.5,
    },
  });

  // 2. ASTM C128 - Specific Gravity & Absorption (Fine)
  const c128 = await prisma.labStandard.upsert({
    where: { code: "ASTM C128" },
    update: {},
    create: {
      code: "ASTM C128",
      name: "Standard Test Method for Relative Density (Specific Gravity) and Absorption of Fine Aggregate",
      organization: "ASTM",
      description: "Measure density and absorption of fine aggregates",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: c128.id,
        code: "SG_FINE",
      },
    },
    update: {},
    create: {
      standardId: c128.id,
      name: "Specific Gravity (Fine)",
      code: "SG_FINE",
      unit: "OD",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: c128.id,
        code: "ABS_FINE",
      },
    },
    update: {},
    create: {
      standardId: c128.id,
      name: "Absorption (Fine)",
      code: "ABS_FINE",
      unit: "%",
      warningMax: 3.0,
    },
  });

  console.log("✅ Aggregate Standards Seeding Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
