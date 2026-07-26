"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Resolves the Customer ID linked to the current user.
 * We use UserSetting 'portal_customer_id' as a non-destructive alternative to schema changes.
 */
async function getLinkedCustomerId(userId: number) {
  const setting = await prisma.userSetting.findUnique({
    where: {
      userId_key: { userId, key: "portal_customer_id" },
    },
  });
  return setting ? parseInt(setting.value) : null;
}

export async function getPortalDashboardData() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

    const customerId = await getLinkedCustomerId(user.id);
    if (!customerId)
      return {
        success: true,
        customer: null,
        activeOrders: [],
        summary: { totalVolume: 0, testCount: 0 },
      };

    const [customer, activeOrders, resultsCount] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.order.findMany({
        where: { customerId, status: { notIn: ["CLOSED", "CANCELLED"] } },
        include: {
          mixDesign: true,
          tickets: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cubeTest.count({
        where: { order: { customerId }, status: "APPROVED" },
      }),
    ]);

    const totalVolume = activeOrders.reduce((sum, o) => sum + o.volume, 0);

    return {
      success: true,
      customer,
      activeOrders,
      summary: {
        totalVolume,
        testCount: resultsCount,
      },
    };
  } catch (error: unknown) {
    console.error("[PORTAL] getPortalDashboardData error:", error);
    if (
      (error as Error).message === "NOT_AUTHENTICATED" ||
      (error as Error).message === "UNAUTHENTICATED" ||
      (error as Error).message === "Unauthorized"
    ) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function getPortalOrderDetails(orderId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

    const customerId = await getLinkedCustomerId(user.id);
    if (!customerId) return { success: false, error: "FORBIDDEN" };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mixDesign: true,
        tickets: { orderBy: { createdAt: "desc" } },
        cubeTests: { where: { status: "APPROVED" } },
      },
    });

    if (!order || order.customerId !== customerId) {
      return { success: false, error: "ACCESS_DENIED" };
    }

    return { success: true, order };
  } catch (error: unknown) {
    console.error("[PORTAL] getPortalOrderDetails error:", error);
    if (
      (error as Error).message === "NOT_AUTHENTICATED" ||
      (error as Error).message === "UNAUTHENTICATED" ||
      (error as Error).message === "Unauthorized"
    ) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function getPortalOrders() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

    const customerId = await getLinkedCustomerId(user.id);
    if (!customerId) return { success: true, orders: [] };

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        mixDesign: true,
        tickets: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, orders };
  } catch (error: unknown) {
    console.error("[PORTAL] getPortalOrders error:", error);
    if (
      (error as Error).message === "NOT_AUTHENTICATED" ||
      (error as Error).message === "UNAUTHENTICATED" ||
      (error as Error).message === "Unauthorized"
    ) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}

export async function getPortalLabResults() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "NOT_AUTHENTICATED" };

    const customerId = await getLinkedCustomerId(user.id);
    if (!customerId) return { success: true, tests: [] };

    const tests = await prisma.cubeTest.findMany({
      where: {
        order: { customerId },
        status: "APPROVED",
      },
      include: {
        order: {
          include: {
            mixDesign: true,
          },
        },
      },
      orderBy: { sampleDate: "desc" },
    });

    return { success: true, tests };
  } catch (error: unknown) {
    console.error("[PORTAL] getPortalLabResults error:", error);
    if (
      (error as Error).message === "NOT_AUTHENTICATED" ||
      (error as Error).message === "UNAUTHENTICATED" ||
      (error as Error).message === "Unauthorized"
    ) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
    return { success: false, error: "SERVER_ERROR" };
  }
}
