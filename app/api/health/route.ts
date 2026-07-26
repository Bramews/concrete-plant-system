import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const start = performance.now();
  let dbStatus = "HEALTHY";
  let dbLatency = 0;

  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Math.round(performance.now() - dbStart);
  } catch (e) {
    dbStatus = "DOWN";
    console.error("Health Check DB Error:", e);
  }

  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: dbStatus === "HEALTHY" ? "OPERATIONAL" : "DEGRADED",
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        },
        uptime: process.uptime(),
      },
    },
    latency: Math.round(performance.now() - start) + "ms",
  };

  return NextResponse.json(healthData, {
    status: dbStatus === "HEALTHY" ? 200 : 503,
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
