import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/security/password";

async function main() {
  const username = "cube";
  const email = "cube@concrete.com";
  const password = "123";

  console.log(`🔧 Fixing user '${username}'...`);

  // 1. Ensure Role Exists
  let role = await prisma.role.findFirst({ where: { name: "OPERATOR" } });
  if (!role) {
    console.log("Creating OPERATOR role...");
    role = await prisma.role.create({
      data: { name: "OPERATOR", displayName: "Operator", isSystem: true },
    });
  }

  // 2. Ensure Company Exists
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found to attach user to.");

  // 3. Upsert User
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email,
      password: hashedPassword,
      status: "ACTIVE",
      companyId: company.id,
    },
    create: {
      username,
      name: "Cube User",
      email,
      password: hashedPassword,
      status: "ACTIVE",
      companyId: company.id,
    },
  });

  console.log("✅ User upserted:", user.id);

  // 4. Fix Memberships
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.membership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      roleId: role.id,
    },
  });

  console.log("✅ Membership fixed (OPERATOR).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
