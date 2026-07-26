import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Users:", await prisma.user.count());
  console.log("Roles:", await prisma.role.count());
  console.log("Companies:", await prisma.company.count());
  console.log("Plans:", await prisma.plan.count());
  console.log("SystemOwners:", await prisma.systemOwner.count());
}

main().finally(() => prisma.$disconnect());
