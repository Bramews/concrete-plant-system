const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Lab Standards...");

  const standards = [
    {
      code: "ASTM_C39",
      name: "Standard Test Method for Compressive Strength of Cylindrical Concrete Specimens",
      organization: "ASTM",
      description:
        "Used for cylindrical specimens. Requires correction factor if L/D < 2.",
    },
    {
      code: "BS_1881",
      name: "Testing Concrete - Method for Determination of Compressive Strength of Concrete Cubes",
      organization: "BS",
      description:
        "Standard British test for cube specimens. No L/D correction needed for standard cubes.",
    },
    {
      code: "IQS_5_1984",
      name: "Portland Cement (Iraqi Standard Specification No. 5)",
      organization: "IQS",
      year: 1984,
      description: "Iraqi standard for Portland Cement requirements.",
    },
    {
      code: "IQS_45_1984",
      name: "Aggregate from Natural Sources for Concrete (Iraqi Standard No. 45)",
      organization: "IQS",
      year: 1984,
      description: "Iraqi standard for aggregates used in concrete.",
    },
    {
      code: "ACI_318",
      name: "Building Code Requirements for Structural Concrete",
      organization: "ACI",
      description:
        "American Concrete Institute standard for structural concrete design and testing.",
    },
  ];

  for (const std of standards) {
    await prisma.labStandard.upsert({
      where: { code: std.code },
      update: std,
      create: std,
    });
    console.log(`Upserted: ${std.code}`);
  }

  // Seed Test Methods (linked to standards)
  // 1. Compressive Strength (ASTM C39)
  const astmC39 = await prisma.labStandard.findUnique({
    where: { code: "ASTM_C39" },
  });
  if (astmC39) {
    await prisma.testMethod.upsert({
      where: {
        standardId_code: {
          standardId: astmC39.id,
          code: "COMPRESSIVE_STRENGTH",
        },
      },
      update: {},
      create: {
        standardId: astmC39.id,
        name: "Compressive Strength",
        code: "COMPRESSIVE_STRENGTH",
        unit: "MPa",
        description: "Cylinder Compressive Strength",
      },
    });
  }

  // 2. Compressive Strength (BS 1881)
  const bs1881 = await prisma.labStandard.findUnique({
    where: { code: "BS_1881" },
  });
  if (bs1881) {
    await prisma.testMethod.upsert({
      where: {
        standardId_code: {
          standardId: bs1881.id,
          code: "COMPRESSIVE_STRENGTH",
        },
      },
      update: {},
      create: {
        standardId: bs1881.id,
        name: "Compressive Strength",
        code: "COMPRESSIVE_STRENGTH",
        unit: "MPa", // or N/mm2
        description: "Cube Compressive Strength",
      },
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
