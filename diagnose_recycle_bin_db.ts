import { prisma } from "./lib/prisma";

async function diagnoseRecycleBin() {
  console.log("🔍 Diagnosing Recycle Bin Issue...");

  // 1. Check all companies and their deletedAt status
  const allCompanies = await (prisma.company as any).findMany({
    includeDeleted: true,
  });

  console.log(`\nFound ${allCompanies.length} companies in total.`);
  allCompanies.forEach((c: any) => {
    console.log(`- [${c.id}] ${c.name} | deletedAt: ${c.deletedAt}`);
  });

  // 2. Check all users and their deletedAt status
  const allUsers = await (prisma.user as any).findMany({
    includeDeleted: true,
  });

  console.log(`\nFound ${allUsers.length} users in total.`);
  allUsers.forEach((u: any) => {
    console.log(`- [${u.id}] ${u.email} | deletedAt: ${u.deletedAt}`);
  });

  // 3. Check what the 'findDeleted' method returns
  console.log("\nTesting findDeleted() on Company...");
  const deletedCompanies = await (prisma.company as any).findDeleted();
  console.log(`findDeleted() returned ${deletedCompanies.length} companies.`);
}

diagnoseRecycleBin()
  .catch(console.error)
  .finally(async () => await (prisma as any).$disconnect());
