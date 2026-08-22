import { PrismaClient } from "../prisma/generated-client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: {
      company: true,
      memberships: {
        include: { role: true }
      }
    }
  });

  console.log(`Found ${users.length} users in DB:`);
  for (const u of users) {
    const roles = u.memberships.map(m => m.role.name).join(", ");
    const is123 = await bcrypt.compare("123", u.password);
    console.log(`- Username: ${u.username} | Email: ${u.email} | Roles: [${roles}] | Password is '123': ${is123}`);
  }

  // Ensure Ahmed password is explicitly 123
  const hash123 = await bcrypt.hash("123", 10);
  const updatedAhmed = await prisma.user.updateMany({
    where: {
      OR: [
        { username: "Ahmed" },
        { username: "ahmed" },
        { email: "ahmed@concrete.com" }
      ]
    },
    data: {
      password: hash123,
      status: "ACTIVE"
    }
  });
  console.log(`Updated Ahmed user password hash: count = ${updatedAhmed.count}`);

  // Ensure SystemOwner table also has 123
  await prisma.systemOwner.updateMany({
    where: { email: "ahmed@concrete.com" },
    data: { password: hash123 }
  });

  // Ensure manager@demo-plant password is 123
  await prisma.user.updateMany({
    where: {
      OR: [
        { username: "manager@demo-plant" },
        { username: "manager" },
        { email: "manager@demo.com" }
      ]
    },
    data: {
      password: hash123,
      status: "ACTIVE"
    }
  });

  console.log("All essential user credentials verified and updated to 123.");
  await prisma.$disconnect();
}

run().catch(console.error);
