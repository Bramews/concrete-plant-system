import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const materials = await prisma.material.count();
  const vehicles = await prisma.vehicle.count();
  const txs = await prisma.inventoryTransaction.count();

  console.log({ materials, vehicles, txs });

  const firstCompany = await prisma.company.findFirst();
  if (firstCompany) {
    console.log("First Company ID:", firstCompany.id);
  } else {
    console.log("No companies found!");
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
