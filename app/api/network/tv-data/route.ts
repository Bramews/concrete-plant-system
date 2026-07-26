import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectApiRoute } from "@/lib/api-protection";

export async function POST(request: NextRequest) {
  try {
    const check = await protectApiRoute(request, { requireAuth: false });
    if (!check.allowed) return check.response!;

    const { companyId, guestToken, allowedOrderId, allowedMixId } =
      await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Missing companyId" },
        { status: 400 },
      );
    }

    if (guestToken) {
      // التحقق من رمز الضيف المؤقت
      const guestLink = await prisma.guestLink.findUnique({
        where: { token: guestToken },
      });

      if (
        !guestLink ||
        new Date() > guestLink.expiresAt ||
        guestLink.companyId !== Number(companyId)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired guest token" },
          { status: 403 },
        );
      }
    } else {
      // التحقق من صلاحيات المستخدم الفعلي (الموظف) المسجل دخوله
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access" },
          { status: 401 },
        );
      }
      if (
        session.role !== "SYSTEM_OWNER" &&
        Number(session.companyId) !== Number(companyId)
      ) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Tenant mismatch" },
          { status: 403 },
        );
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const isRestricted = !!(allowedOrderId || allowedMixId);

    const batches = await prisma.batch.findMany({
      where: {
        companyId: Number(companyId),
        order: {
          ...(allowedOrderId ? { id: Number(allowedOrderId) } : {}),
          ...(allowedMixId ? { mixDesignId: Number(allowedMixId) } : {}),
        },
        ...(!isRestricted ? { createdAt: { gte: startOfDay } } : {}),
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: { select: { name: true } },
            project: { select: { name: true } },
            mixDesign: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const tests = await prisma.cubeTest.findMany({
      where: {
        companyId: Number(companyId),
        order: {
          ...(allowedOrderId ? { id: Number(allowedOrderId) } : {}),
          ...(allowedMixId ? { mixDesignId: Number(allowedMixId) } : {}),
        },
        ...(!isRestricted ? { sampleDate: { gte: startOfDay } } : {}),
      },
      select: {
        id: true,
        mpa: true,
        status: true,
        sampleDate: true,
        age: true,
        order: {
          select: {
            orderNumber: true,
            mixDesign: { select: { code: true } },
          },
        },
      },
      orderBy: { sampleDate: "desc" },
      take: 10,
    });

    // Format output for frontend compatibility (TvDashboard expects lowercase relation fields)
    const formattedBatches = batches.map((b) => ({
      ...b,
      order: b.order
        ? {
            orderNumber: b.order.orderNumber,
            customer: b.order.customer ? { name: b.order.customer.name } : null,
            project: b.order.project ? { name: b.order.project.name } : null,
            mixDesign: b.order.mixDesign
              ? { code: b.order.mixDesign.code, name: b.order.mixDesign.name }
              : null,
          }
        : null,
    }));

    const formattedTests = tests.map((t) => ({
      ...t,
      order: t.order
        ? {
            orderNumber: t.order.orderNumber,
            mixDesign: t.order.mixDesign
              ? { code: t.order.mixDesign.code }
              : null,
          }
        : null,
    }));

    const totalVolume = formattedBatches.reduce(
      (sum, b) => sum + (b.quantity || 0),
      0,
    );
    const totalBatches = formattedBatches.length;

    // Fetch active delivery tickets for live GPS tracking
    const tickets = allowedOrderId
      ? await prisma.deliveryTicket.findMany({
          where: {
            orderId: Number(allowedOrderId),
            status: { in: ["DISPATCHED", "IN_TRANSIT", "ARRIVED", "POURING"] },
          },
          select: {
            id: true,
            ticketNumber: true,
            truckNumber: true,
            driverName: true,
            status: true,
            cumulativeQuantity: true,
            currentLat: true,
            currentLng: true,
            destinationLabel: true,
            destinationLat: true,
            destinationLng: true,
            updatedAt: true,
          },
        })
      : [];

    return NextResponse.json({
      success: true,
      batches: formattedBatches,
      tests: formattedTests,
      totalVolume,
      totalBatches,
      tickets,
    });
  } catch (error: unknown) {
    console.error("Tv-data endpoint error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
