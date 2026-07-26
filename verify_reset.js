const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying DB State...");

  // 1. Check Users
  const users = await prisma.user.findMany({
    include: { memberships: { include: { role: true } } },
  });
  console.log(`Users found: ${users.length}`);
  users.forEach((u) => {
    console.log(
      ` - ${u.email} (${u.name}) -> Roles: ${u.memberships.map((m) => m.role.name).join(", ")}`,
    );
  });

  // 2. Check System Owner
  const owner = await prisma.systemOwner.findFirst();
  console.log(`System Owner found: ${owner ? "YES" : "NO"}`);
  if (owner) console.log(` - Email: ${owner.email}`);

  // 3. Check Subscription & StripeId
  const sub = await prisma.subscription.findFirst({
    include: { company: true },
  });
  console.log(`Subscription found: ${sub ? "YES" : "NO"}`);
  if (sub) {
    console.log(` - Company: ${sub.company.slug}`);
    console.log(` - StripeId: ${sub.stripeId}`);
    if (!sub.stripeId) console.error("❌ CRITICAL: StripeId is MISSING!");
  }

  // 4. Check Roles Count
  const rolesCount = await prisma.role.count();
  console.log(`Total Roles: ${rolesCount}`);

  // 5. Check for duplicates (system owner role)
  const soRoles = await prisma.role.findMany({
    where: { name: "SYSTEM_OWNER" },
  });
  if (soRoles.length > 1)
    console.error("❌ CRITICAL: Duplicate SYSTEM_OWNER roles found!");

  console.log("✅ Verification Done.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
