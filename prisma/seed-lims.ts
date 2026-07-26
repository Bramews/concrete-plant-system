import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LIMS Standards...");

  // 1. ASTM C143 - Slump
  const slumpStandard = await prisma.labStandard.upsert({
    where: { code: "ASTM C143" },
    update: {},
    create: {
      code: "ASTM C143",
      name: "Standard Test Method for Slump of Hydraulic-Cement Concrete",
      organization: "ASTM",
      description: "Measure the consistency of fresh concrete",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: slumpStandard.id,
        code: "SLUMP",
      },
    },
    update: {},
    create: {
      standardId: slumpStandard.id,
      name: "Slump Test",
      code: "SLUMP",
      unit: "mm",
      warningMin: 50,
      warningMax: 150,
      rejectMin: 0,
    },
  });

  // 2. ASTM C1064 - Temperature
  const tempStandard = await prisma.labStandard.upsert({
    where: { code: "ASTM C1064" },
    update: {},
    create: {
      code: "ASTM C1064",
      name: "Standard Test Method for Temperature of Freshly Mixed Hydraulic-Cement Concrete",
      organization: "ASTM",
      description: "Measure the temperature of fresh concrete",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: tempStandard.id,
        code: "TEMP",
      },
    },
    update: {},
    create: {
      standardId: tempStandard.id,
      name: "Concrete Temperature",
      code: "TEMP",
      unit: "°C",
      warningMax: 32,
      rejectMax: 35,
    },
  });

  // 3. ASTM C231 - Air Content
  const airStandard = await prisma.labStandard.upsert({
    where: { code: "ASTM C231" },
    update: {},
    create: {
      code: "ASTM C231",
      name: "Standard Test Method for Air Content of Freshly Mixed Concrete by the Pressure Method",
      organization: "ASTM",
      description: "Measure air content in fresh concrete",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: airStandard.id,
        code: "AIR",
      },
    },
    update: {},
    create: {
      standardId: airStandard.id,
      name: "Air Content",
      code: "AIR",
      unit: "%",
      warningMin: 1.5,
      warningMax: 4.5, // Typical non-air-entrained
    },
  });

  // 4. ASTM C566 - Aggregate Moisture
  const moistureStandard = await prisma.labStandard.upsert({
    where: { code: "ASTM C566" },
    update: {},
    create: {
      code: "ASTM C566",
      name: "Standard Test Method for Total Evaporable Moisture Content of Aggregate by Drying",
      organization: "ASTM",
      description: "Measure moisture content in aggregates",
    },
  });

  await prisma.testMethod.upsert({
    where: {
      standardId_code: {
        standardId: moistureStandard.id,
        code: "MOISTURE",
      },
    },
    update: {},
    create: {
      standardId: moistureStandard.id,
      name: "Moisture Content",
      code: "MOISTURE",
      unit: "%",
      warningMax: 5,
    },
  });

  // 5. IQS 45 - Iraqi Standard
  const iqsStandard = await prisma.labStandard.upsert({
    where: { code: "IQS 45/1984" },
    update: {},
    create: {
      code: "IQS 45/1984",
      name: "Aggregate from Natural Sources for Concrete",
      organization: "IQS",
      year: 1984,
      description: "Iraqi Standard for aggregates grading and properties",
    },
  });

  // We will add specific TestMethods for IQS later (like Sieve Analysis Zones)

  console.log("✅ LIMS Seeding Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
