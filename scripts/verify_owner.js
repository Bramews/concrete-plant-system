const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifySystemOwner() {
  console.log("🔍 Starting Strict System Owner Verification...");

  // 1. Get System Owner Role
  const systemOwnerRole = await prisma.role.findFirst({
    where: { name: "SYSTEM_OWNER", companyId: null },
    include: { permissions: { include: { permission: true } } },
  });

  if (!systemOwnerRole) {
    console.error("❌ FAILED: SYSTEM_OWNER role not found!");
    process.exit(1);
  }

  console.log(`✅ Found SYSTEM_OWNER role (ID: ${systemOwnerRole.id})`);

  // 2. Get ALL Permissions defined in DB
  const allPermissions = await prisma.permission.findMany();
  const totalPermsCount = allPermissions.length;
  console.log(`ℹ️ Total Permissions in System: ${totalPermsCount}`);

  // 3. Compare
  const ownerPermsCount = systemOwnerRole.permissions.length;
  console.log(`ℹ️ SYSTEM_OWNER Permissions Count: ${ownerPermsCount}`);

  if (ownerPermsCount !== totalPermsCount) {
    console.error("❌ FAILED: SYSTEM_OWNER does NOT have all permissions!");

    const ownerPermIds = new Set(
      systemOwnerRole.permissions.map((p) => p.permissionId),
    );
    const missing = allPermissions.filter((p) => !ownerPermIds.has(p.id));

    console.error("❌ Missing Permissions:");
    missing.forEach((p) => console.error(`   - ${p.id} (${p.description})`));

    process.exit(1);
  }

  console.log("✅ SUCCESS: SYSTEM_OWNER has 100% of permissions.");

  // 4. Verify System Owner User Exists
  const ownerUser = await prisma.user.findUnique({
    where: { email: "ahmed@concrete.com" },
    include: { memberships: { include: { role: true } } },
  });

  if (!ownerUser) {
    console.error(
      "❌ FAILED: System Owner User (ahmed@concrete.com) not found.",
    );
    process.exit(1);
  }

  const hasOwnerRole = ownerUser.memberships.some(
    (m) => m.role.name === "SYSTEM_OWNER",
  );
  if (!hasOwnerRole) {
    console.error(
      "❌ FAILED: User 'ahmed@concrete.com' does NOT have SYSTEM_OWNER role assigned.",
    );
    process.exit(1);
  }

  console.log(
    "✅ SUCCESS: User 'ahmed@concrete.com' is assigned SYSTEM_OWNER role.",
  );
}

verifySystemOwner()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
