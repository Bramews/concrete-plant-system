import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latestBatch = await prisma.batch.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actualMixData: true,
        createdAt: true,
      },
    });

    let telemetry = null;
    if (latestBatch?.actualMixData) {
      try {
        const parsed = JSON.parse(latestBatch.actualMixData);
        telemetry = parsed.proportions || parsed;
      } catch (e) {
        // Silent parse catch
      }
    }

    return NextResponse.json({
      success: true,
      latestBatch: telemetry
        ? {
            actualCementKg: telemetry.actualCementKg || telemetry.cement || 0,
            targetCementKg: telemetry.targetCementKg || 380,
            actualAggregatesKg:
              telemetry.actualAggregatesKg || telemetry.aggregates || 0,
            targetAggregatesKg: telemetry.targetAggregatesKg || 1200,
            actualWaterLiters:
              telemetry.actualWaterLiters || telemetry.water || 0,
            targetWaterLiters: telemetry.targetWaterLiters || 175,
            actualAdmixtureLiters:
              telemetry.actualAdmixtureLiters || telemetry.admixture || 0,
            targetAdmixtureLiters: telemetry.targetAdmixtureLiters || 4.5,
          }
        : null,
    });
  } catch (err) {
    return NextResponse.json({ success: true, latestBatch: null });
  }
}

/**
 * API Endpoint for receiving live SCADA / PLC scale weights directly from plant hardware.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { batchId, companyId, plcSecret, scaleData } = body;

    if (!batchId || !scaleData) {
      return NextResponse.json(
        { error: "Missing required PLC batch parameters" },
        { status: 400 },
      );
    }

    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: Number(batchId) },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Update actualMixData with exact PLC scale sensor telemetry
    const actualMixData = JSON.stringify({
      proportions: scaleData.proportions || scaleData,
      plcDeviceId: scaleData.plcDeviceId || "PLC-SCADA-MAIN",
      timestamp: Date.now(),
    });

    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        actualMixData,
      },
    });

    // Create Audit Log for PLC Telemetry
    await prisma.auditLog.create({
      data: {
        action: "PLC_TELEMETRY_RECORDED",
        details: `Recorded live PLC scale weights for Batch #${batch.id}`,
        entity: "Batch",
        entityId: String(batch.id),
        companyId: batch.companyId || companyId || undefined,
        role: "SYSTEM",
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "PLC scale weights telemetry recorded successfully",
      batchId: batch.id,
    });
  } catch (error) {
    console.error("PLC Batch Weights Telemetry Error:", error);
    return NextResponse.json(
      { error: "Failed to record PLC batch telemetry" },
      { status: 500 },
    );
  }
}
