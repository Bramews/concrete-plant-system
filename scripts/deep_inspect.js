const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  let output = "--- DEEP INSPECTION ---\n";

  // 1. All Roles
  const allRoles = await prisma.role.findMany();
  output += `\n[ALL ROLES] Count: ${allRoles.length}\n`;
  allRoles.forEach((r) => {
    output += `- ID: ${r.id}, Name: "${r.name}", Display: "${r.displayName}", isSystem: ${r.isSystem}, companyId: ${r.companyId}\n`;
  });

  // 2. Company 3 Users (Direct & Membership)
  const companyId = 3;
  const memberships = await prisma.membership.findMany({
    where: { companyId },
    include: { user: true, role: true },
  });
  output += `\n[COMPANY 3 MEMBERSHIPS] Count: ${memberships.length}\n`;
  memberships.forEach((m) => {
    output += `- User: ${m.user.name} (${m.user.email}), Role: ${m.role?.name}, Status: ${m.status}, Deleted: ${m.deletedAt}\n`;
  });

  const directUsers = await prisma.user.findMany({
    where: { companyId },
  });
  output += `\n[COMPANY 3 DIRECT USERS] Count: ${directUsers.length}\n`;
  directUsers.forEach((u) => (output += `- ${u.name} (${u.email})\n`));

  fs.writeFileSync("deep_inspect.txt", output);
  console.log("Done. Results in deep_inspect.txt");
}

main().finally(() => prisma.$disconnect());
