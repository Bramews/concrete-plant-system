import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await (prisma as any).user.findMany({
    take: 5,
    include: {
      memberships: {
        include: {
          role: true,
        },
      },
    },
  });

  const owners = await (prisma as any).systemOwner.findMany();

  console.log("--- SYSTEM OWNERS ---");
  console.log(JSON.stringify(owners, null, 2));
  console.log("--- REGULAR USERS ---");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
