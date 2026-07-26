const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAndVerify() {
  console.log("--- Access Diagnosis ---");

  // 1. Fix 'cube'
  console.log("\n🔧 Fixing user: cube");
  const cube = await prisma.user.findFirst({
    where: { username: "cube" },
    include: { memberships: true },
  });

  if (cube) {
    if (cube.status !== "ACTIVE") {
      console.log(`   - Updating User status from ${cube.status} to ACTIVE`);
      await prisma.user.update({
        where: { id: cube.id },
        data: { status: "ACTIVE" },
      });
    } else {
      console.log("   - User status is already ACTIVE");
    }

    const membership = cube.memberships[0]; // Assuming first for now
    if (membership) {
      if (membership.status !== "ACTIVE") {
        console.log(
          `   - Updating Membership status from ${membership.status} to ACTIVE`,
        );
        await prisma.membership.update({
          where: { id: membership.id },
          data: { status: "ACTIVE", deletedAt: null },
        });
      } else {
        console.log("   - Membership status is already ACTIVE");
      }
    } else {
      console.log("   ❌ No membership found for cube!");
      // Link to Company 2 as MANAGER if missing (Repetition of safety net)
      const role = await prisma.role.findFirst({
        where: { name: "MANAGER", companyId: 2 },
      });
      if (role) {
        await prisma.membership.create({
          data: {
            userId: cube.id,
            companyId: 2,
            roleId: role.id,
            status: "ACTIVE",
          },
        });
        console.log(
          "   ✅ Created new ACTIVE membership for cube in Company 2",
        );
        await prisma.user.update({
          where: { id: cube.id },
          data: { companyId: 2 },
        });
      }
    }
    console.log("   ✅ User cube should be able to login now.");
    console.log("   👉 Target URL: /system/manager");
  } else {
    console.log("   ❌ User cube not found.");
  }

  // 2. Analyze '55'
  console.log("\n🔍 Check User ID: 55");
  const user55 = await prisma.user.findUnique({
    where: { id: 55 },
    include: { memberships: { include: { role: true } } },
  });

  if (user55) {
    console.log(`   Role: ${user55.memberships[0]?.role.name}`);
    if (user55.memberships[0]?.role.name === "COMPANY_ADMIN") {
      console.log("   ℹ Info: This user is COMPANY_ADMIN.");
      console.log("   ⛔ Access to /admin is BLOCKED (System Owner only).");
      console.log("   👉 Correct URL: /system/manager");
    }
  } else {
    console.log("   ❌ User ID 55 not found.");
  }
}

fixAndVerify()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
