import { prisma } from "../lib/prisma";

async function main() {
  const users = await (prisma.user as any).findMany({
    where: { __bypassTenancy: true },
    select: { id: true, username: true, email: true, status: true },
  });
  console.log("All users in DB:", JSON.stringify(users, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
