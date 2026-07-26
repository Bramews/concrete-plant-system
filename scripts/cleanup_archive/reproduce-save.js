const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const data = {
    name: "Reproduction Mix",
    code: "REPRO-001",
    strengthClass: "C30/37",
    components: [
      {
        materialName: "cement",
        quantity: 350,
        unit: "kg",
        specificGravity: 3.15,
      },
      {
        materialName: "sand",
        quantity: 800,
        unit: "kg",
        specificGravity: 2.65,
        moistureContent: 3.5,
        absorption: 1.2,
      },
    ],
  };

  try {
    const mix = await prisma.mixDesign.create({
      data: {
        companyId: 1, // Assume company 1
        name: data.name,
        code: data.code,
        strengthClass: data.strengthClass,
        status: "DRAFT",
        components: {
          create: data.components.map((c) => ({
            ...c,
            companyId: 1,
          })),
        },
      },
    });
    console.log("Success:", mix.id);
  } catch (e) {
    console.error("Error Details:", e);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
