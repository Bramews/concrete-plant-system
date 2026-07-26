import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceDeleteCompany(companyId: number) {
  try {
    // Delete roles
    await prisma.rolePermission.deleteMany({
      where: { role: { companyId } },
    });
    await prisma.userRole.deleteMany({
      where: { role: { companyId } },
    });
    await prisma.role.deleteMany({ where: { companyId } });

    // Delete departments
    await prisma.department.deleteMany({ where: { companyId } });

    // Delete audit logs
    await prisma.auditLog.deleteMany({ where: { companyId } });

    // Delete behavior logs
    await prisma.behaviorLog.deleteMany({ where: { companyId } });

    // Try deleting company again
    await prisma.$executeRaw`DELETE FROM "Company" WHERE id = ${companyId}`;
    console.log(`Deleted company ${companyId}`);
  } catch (e) {
    console.log(`Failed for company ${companyId}: ${e.message}`);
  }
}

async function main() {
  try {
    const deletedCompanies = await prisma.$queryRaw<
      any[]
    >`SELECT id FROM "Company" WHERE "deletedAt" IS NOT NULL`;
    console.log(`Found ${deletedCompanies.length} companies to delete.`);
    for (const c of deletedCompanies) {
      await forceDeleteCompany(c.id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
