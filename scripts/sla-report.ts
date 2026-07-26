import { prisma } from "../lib/prisma";

async function generateSLAReport() {
  console.log("📊 Generating SLA & Performance Report...");

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Clause 5.1: Max response time & Clause 1.1: System Health
  const metrics = await prisma.systemMetric.findMany({
    where: { timestamp: { gte: last24h }, metricName: { contains: "LATENCY" } },
  });

  const avgLatency =
    metrics.reduce((acc, m) => acc + m.value, 0) / (metrics.length || 1);
  const maxLatency = Math.max(...metrics.map((m) => m.value), 0);
  const violations = metrics.filter((m) => m.value > 2000).length;

  console.log(`--- SLA SUMMARY (Last 24h) ---`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Max Latency: ${maxLatency}ms`);
  console.log(`SLA Violations (>2s): ${violations}`);
  console.log(`-----------------------------`);

  // Clause 5.1: Uptime (Mocked for POC based on error rate)
  const totalLogs = await prisma.auditLog.count({
    where: { timestamp: { gte: last24h } },
  });
  const failedLogs = await prisma.auditLog.count({
    where: { timestamp: { gte: last24h }, action: { contains: "FAILED" } },
  });

  const availability =
    totalLogs > 0 ? ((totalLogs - failedLogs) / totalLogs) * 100 : 100;
  console.log(`Estimated Availability: ${availability.toFixed(2)}%`);

  await prisma.$disconnect();
}

generateSLAReport();
