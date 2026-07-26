import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🕵️ Checking Audit Logs...");

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
    include: { user: { select: { username: true, role: true } } },
  });

  console.log(`Found ${logs.length} recent logs:`);
  logs.forEach((log) => {
    console.log(
      `[${log.timestamp.toISOString()}] ${log.action} by ${log.user?.username || "SYSTEM"} (${log.user?.role}): ${log.details}`,
    );
  });

  // Check for recent BACKUP
  const backupLog = logs.find((l) => l.action === "SYSTEM_BACKUP");
  if (backupLog) {
    console.log("✅ SYSTEM_BACKUP log found.");
  } else {
    console.warn("⚠️ SYSTEM_BACKUP log NOT found in recent 10 entries.");
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
