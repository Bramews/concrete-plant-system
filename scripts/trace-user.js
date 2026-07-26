require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function traceUser() {
  const username = "cube"; // Target user
  console.log(`\n🔍 TRACING USER: ${username}`);
  console.log("==================================================");

  const user = await prisma.user.findFirst({
    where: { username },
    include: {
      company: true,
      memberships: { include: { role: true } },
      sessions: true,
    },
  });

  if (!user) {
    console.error("❌ User not found!");
    return;
  }

  console.log(`👤 User ID: ${user.id}`);
  console.log(`📧 Email:   ${user.email}`);
  console.log(`🔒 Status:  ${user.status}`);
  console.log(`🏢 Company ID: ${user.companyId || "NULL"}`);

  if (user.company) {
    console.log(`   - Company Name: ${user.company.name}`);
    console.log(`   - Company Slug: ${user.company.slug}`);
    console.log(`   - Company Status: ${user.company.status}`);
  } else {
    console.warn("⚠️  User has NO linked company!");
  }

  console.log("\n💳 Memberships:");
  if (user.memberships.length === 0) {
    console.warn("⚠️  No memberships found!");
  } else {
    user.memberships.forEach((m) => {
      console.log(`   - Role: ${m.role.name} (${m.roleId})`);
      console.log(`   - Status: ${m.status}`);
      console.log(`   - Company ID: ${m.companyId}`);
      if (m.deletedAt) console.error("   ❌ DELETED MEMBERSHIP");
    });
  }

  console.log("\n🔑 Active Sessions:");
  if (user.sessions.length === 0) {
    console.log("   (No active sessions in DB)");
  } else {
    user.sessions.forEach((s) => {
      console.log(`   - ID: ${s.id}`);
      console.log(`   - Expires: ${s.expiresAt}`);
      console.log(`   - Revoked: ${s.isRevoked}`);
      console.log(`   - Company Context: ${s.companyId}`);
      console.log(`   - Token Hash: ${s.tokenHash.substring(0, 10)}...`);
    });
  }

  console.log("==================================================");
  console.log("Trace Complete.\n");
}

traceUser()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
