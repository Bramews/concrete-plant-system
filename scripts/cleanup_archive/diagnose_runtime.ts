import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("=== RUNTIME DIAGNOSIS START ===");
  console.log("1️⃣  Environment & Paths:");
  console.log(`   - CWD: ${process.cwd()}`);
  console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL}`);

  console.log("\n2️⃣  File System Check:");
  const rootDb = path.join(process.cwd(), "dev.db");
  const prismaDb = path.join(process.cwd(), "prisma", "dev.db");

  if (fs.existsSync(rootDb)) {
    const stats = fs.statSync(rootDb);
    console.log(
      `   - [ROOT] dev.db FOUND! Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`,
    );
  } else {
    console.log(`   - [ROOT] dev.db NOT FOUND`);
  }

  if (fs.existsSync(prismaDb)) {
    const stats = fs.statSync(prismaDb);
    console.log(
      `   - [PRISMA] prisma/dev.db FOUND! Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`,
    );
  } else {
    console.log(`   - [PRISMA] prisma/dev.db NOT FOUND`);
  }

  console.log("\n3️⃣  Database Connectivity & Content:");
  try {
    // Query raw tables to prove connection
    const tables: any[] = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`,
    );
    console.log(
      `   - Tables Found (${tables.length}):`,
      tables.map((t) => t.name).join(", "),
    );

    // Count basic entities
    const users = await prisma.user.count();
    const roles = await prisma.role.count();
    const companies = await prisma.company.count();

    console.log(
      `   - Counts: Users=${users}, Roles=${roles}, Companies=${companies}`,
    );

    if (tables.length === 0) {
      console.error("   ❌ CRITICAL: Connected DB has NO tables!");
    } else {
      console.log("   ✅ Connection successful and DB has schema.");
    }
  } catch (e) {
    console.error("   ❌ CONNECTION ERROR:", e);
  }

  console.log("=== RUNTIME DIAGNOSIS END ===");
}

main().finally(() => prisma.$disconnect());
