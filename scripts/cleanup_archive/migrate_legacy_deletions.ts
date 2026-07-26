import { prisma } from "./lib/prisma";

async function migrateLegacyDeletions() {
  console.log("🚀 Migrating Legacy Deletions to Soft-Delete Pattern...");

  try {
    // 1. Migrate Companies
    const legacyCompanies = await (prisma.company as any).findMany({
      where: { status: "DELETED", deletedAt: null },
      includeDeleted: true,
    });

    console.log(`Found ${legacyCompanies.length} legacy deleted companies.`);

    for (const company of legacyCompanies) {
      await (prisma.company as any).update({
        where: { id: company.id },
        data: { deletedAt: new Date() },
      });
      console.log(`- Migrated company: ${company.name}`);
    }

    // 2. Migrate Users (if applicable)
    const legacyUsers = await (prisma.user as any).findMany({
      where: { status: "DELETED", deletedAt: null },
      includeDeleted: true,
    });

    console.log(`\nFound ${legacyUsers.length} legacy deleted users.`);

    for (const user of legacyUsers) {
      await (prisma.user as any).update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      });
      console.log(`- Migrated user: ${user.email}`);
    }

    console.log("\n✨ Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateLegacyDeletions()
  .catch(console.error)
  .finally(async () => await (prisma as any).$disconnect());
