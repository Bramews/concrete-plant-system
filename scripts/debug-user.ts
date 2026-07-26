import { prisma } from "../lib/prisma";

async function main() {
  const username = "cube";
  const user = await prisma.user.findFirst({
    where: { username },
    include: {
      memberships: {
        include: { role: true },
      },
      company: true,
    },
  });

  if (!user) {
    console.log(`❌ User '${username}' not found.`);
    // List all users to see if it's a different name
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        memberships: { include: { role: true } },
      },
    });
    console.log("Available users:", JSON.stringify(allUsers, null, 2));
    return;
  }

  console.log("✅ User Found:");
  console.log(JSON.stringify(user, null, 2));

  // Check roles
  const roles = user.memberships.map((m) => m.role.name);
  console.log("Roles:", roles);

  // Check system owner matches
  const so = await prisma.systemOwner.findFirst({
    where: { email: user.email },
  });
  if (so) console.log("User is also SystemOwner");
}

main();
