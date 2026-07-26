"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { enforceSubscription } from "@/lib/subscriptions";

// -- Permissions --
const CAN_VIEW_ORDERS = [
  "OPERATOR",
  "DISPATCHER",
  "LAB_TECH",
  "LAB_ENGINEER",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "COMPANY_ADMIN",
  "SYSTEM_OWNER",
  "SALES",
  "SALES_REP",
  "SALES_MANAGER",
];
const CAN_CREATE_ORDERS = [
  "SALES",
  "SALES_REP",
  "SALES_MANAGER",
  "DISPATCHER",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "COMPANY_ADMIN",
  "SYSTEM_OWNER",
];
const CAN_MANAGE_ORDERS = [
  "DISPATCHER",
  "MANAGER",
  "DEPARTMENT_MANAGER",
  "COMPANY_ADMIN",
  "SYSTEM_OWNER",
  "SALES_MANAGER",
  "SALES",
];

function checkPermission(role: string, action: "VIEW" | "CREATE" | "MANAGE") {
  const allowed =
    action === "VIEW"
      ? CAN_VIEW_ORDERS
      : action === "CREATE"
        ? CAN_CREATE_ORDERS
        : CAN_MANAGE_ORDERS;

  if (!allowed.includes(role)) {
    throw new Error(`UNAUTHORIZED_ORDER_${action}`);
  }
}

// -- Actions --

export async function getOrders(filters?: { mixDesignId?: number }) {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "VIEW");

  const whereClause: any = {
    companyId: user.companyId,
  };

  if (filters?.mixDesignId !== undefined) {
    whereClause.mixDesignId = filters.mixDesignId;
  }

  return prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      project: true,
      mixDesign: true,
      _count: { select: { cubeTests: true } },
    },
    orderBy: { id: "desc" },
  });
}

export async function getOrderById(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) return null;

  // Simple permission check (can refine validation later)
  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "VIEW");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
      mixDesign: true,
      cubeTests: { orderBy: { age: "asc" } },
      labApproval: true,
      batches: { include: { deliveryTicket: true }, orderBy: { id: "asc" } },
    },
  });

  if (!order || order.companyId !== user.companyId) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "Order", entityId: String(id), companyId: user.companyId },
    orderBy: { timestamp: "desc" },
    include: { user: { select: { name: true } } },
  });

  return { ...order, auditLogs };
}

export async function createOrder(data: {
  customerId: number | string;
  projectId?: number | string | null;
  mixDesignId: number;
  volume: number;
  date: Date;
  hasPump?: boolean;
  notes?: string;
  customerPhone?: string;
  siteLocation?: string;
  gpsLocation?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  await enforceSubscription(user.companyId);

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "CREATE");

  // VALIDATION: Mix Design MUST be APPROVED
  const mix = await prisma.mixDesign.findUnique({
    where: { id: data.mixDesignId },
  });

  if (!mix || mix.status !== "APPROVED") {
    throw new Error(
      "Cannot create order with Unapproved or Invalid Mix Design.",
    );
  }

  // 1. Resolve Customer ID and update phone if provided
  let customerId: number;
  if (typeof data.customerId === "number") {
    customerId = data.customerId;
    if (data.customerPhone) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { phone: data.customerPhone },
      });
    }
  } else if (!isNaN(Number(data.customerId))) {
    customerId = Number(data.customerId);
    if (data.customerPhone) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { phone: data.customerPhone },
      });
    }
  } else {
    // New customer name typed!
    const name = String(data.customerId).trim();
    if (!name) throw new Error("Customer name cannot be empty");
    let customer = await prisma.customer.findFirst({
      where: { companyId: user.companyId, name, deletedAt: null },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId: user.companyId,
          name,
          phone: data.customerPhone || null,
        },
      });
    } else if (data.customerPhone) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: data.customerPhone },
      });
    }
    customerId = customer.id;
  }

  // 2. Resolve Project ID and descriptive/GPS location
  let projectId: number | null = null;
  if (data.projectId) {
    let rawProjectName = "";
    let rawProjectLocation = "";

    if (typeof data.projectId === "number") {
      const proj = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (proj) {
        rawProjectName = proj.name;
        rawProjectLocation = proj.location || "";
      }
    } else if (!isNaN(Number(data.projectId))) {
      const proj = await prisma.project.findUnique({
        where: { id: Number(data.projectId) },
      });
      if (proj) {
        rawProjectName = proj.name;
        rawProjectLocation = proj.location || "";
      }
    } else {
      rawProjectName = String(data.projectId).trim();
    }

    if (rawProjectName) {
      // If pump is required, ensure project name includes "[شامل مضخة]"
      if (data.hasPump && !rawProjectName.includes("[شامل مضخة]")) {
        rawProjectName = `${rawProjectName} [شامل مضخة]`;
      }

      // Combine descriptive location and GPS location
      let finalLocation = (data.siteLocation || "").trim();
      if (data.gpsLocation && data.gpsLocation.trim()) {
        finalLocation += finalLocation
          ? ` (GPS: ${data.gpsLocation.trim()})`
          : `GPS: ${data.gpsLocation.trim()}`;
      }

      // Find or create project with the resolved name
      let project = await prisma.project.findFirst({
        where: {
          companyId: user.companyId,
          name: rawProjectName,
          deletedAt: null,
        },
      });
      if (!project) {
        project = await prisma.project.create({
          data: {
            companyId: user.companyId,
            name: rawProjectName,
            location: finalLocation || null,
            status: "ACTIVE",
          },
        });
      } else if (finalLocation) {
        await prisma.project.update({
          where: { id: project.id },
          data: { location: finalLocation },
        });
      }
      projectId = project.id;
    }
  }

  let order;
  let attempt = 0;
  const MAX_RETRIES = 10;

  while (attempt < MAX_RETRIES) {
    // جلب كل أرقام الطلبيات لهذه الشركة فقط
    const allOrders = await prisma.order.findMany({
      where: { companyId: user.companyId },
      select: { orderNumber: true },
    });

    // استخراج أعلى رقم تسلسلي من كل الأرقام بدون استثناء أي رقم
    let maxNum = 0;
    for (const ord of allOrders) {
      if (ord.orderNumber) {
        const match = ord.orderNumber.match(/ORD-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNumInt = maxNum + 1 + attempt;
    const nextNum = String(nextNumInt).padStart(5, "0");
    const orderNumber = `ORD-${nextNum}`;

    try {
      order = await prisma.order.create({
        data: {
          orderNumber,
          companyId: user.companyId,
          customerId,
          projectId,
          mixDesignId: data.mixDesignId,
          volume: data.volume,
          date: data.date,
          status: ["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(role)
            ? "SUBMITTED"
            : "PENDING",
          notes: data.notes || null,
        },
      });
      break;
    } catch (error: any) {
      if (error.code === "P2002") {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          // آخر محاولة: استخدام Timestamp لضمان الفرادة المطلقة
          const fallbackNumber = `ORD-${Date.now()}`;
          order = await prisma.order.create({
            data: {
              orderNumber: fallbackNumber,
              companyId: user.companyId,
              customerId,
              projectId,
              mixDesignId: data.mixDesignId,
              volume: data.volume,
              date: data.date,
              status: ["MANAGER", "COMPANY_ADMIN", "SYSTEM_OWNER"].includes(
                role,
              )
                ? "SUBMITTED"
                : "PENDING",
              notes: data.notes || null,
            },
          });
          break;
        }
        await new Promise((res) => setTimeout(res, 100 * attempt));
      } else {
        throw error;
      }
    }
  }

  revalidatePath("/system/orders");
  return order;
}

export async function updateOrderStatus(
  id: number,
  status: string,
  reason?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const companyId = user.companyId || 1;

  if (user.companyId) {
    await enforceSubscription(user.companyId);
  }

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "MANAGE");

  // Fetch the order first to get details for workflows
  const order = await prisma.order.findUnique({
    where: { id },
    include: { mixDesign: true, project: true },
  });

  if (!order || order.companyId !== companyId) {
    throw new Error("Order not found or access denied");
  }

  if (status === "APPROVED") {
    // ONLY the MANAGER role (مدير المعمل), COMPANY_ADMIN (مسؤول الشركة) and SYSTEM_OWNER (مالك النظام) can approve orders
    if (
      role !== "MANAGER" &&
      role !== "SYSTEM_OWNER" &&
      role !== "COMPANY_ADMIN"
    ) {
      throw new Error(
        "غير مصرح لك بالموافقة على الطلبات. هذا الإجراء مخصص لمدير المعمل ومسؤول الشركة فقط.",
      );
    }

    // Manager approval: update order status to SUBMITTED (pending Lab approval)
    await prisma.order.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        approverName: user.name || "Manager",
      },
    });
  } else if (status === "CANCELLED" || status === "REJECTED") {
    // ── Cancellation Workflow with WHO and WHY ──
    if (!reason || !reason.trim()) {
      throw new Error("يجب كتابة سبب الإلغاء/الرفض أولاً.");
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: status,
        approverName: `${user.name} | ${reason.trim()}`, // Store who and why here
      },
    });

    const isRejected = status === "REJECTED";
    const statusAr = isRejected ? "مرفوض" : "ملغي";

    // Create audit log for security/integrity
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: isRejected ? "REJECT" : "CANCEL",
        role,
        entity: "Order",
        entityId: String(id),
        newStatus: status,
        reason: reason.trim(),
        details: `تم تحديث حالة الطلب إلى ${statusAr} بواسطة ${user.name} (السبب: ${reason.trim()})`,
      },
    });
  } else if (status === "PRODUCTION") {
    if (role !== "DISPATCHER" && role !== "OPERATOR") {
      throw new Error(
        "غير مصرح لك ببدء الإنتاج. هذا الإجراء مخصص لمشغل المحطة (Dispatcher) فقط.",
      );
    }
    if (order.status !== "LAB_APPROVED") {
      throw new Error(
        "لا يمكن بدء الإنتاج قبل موافقة المختبر بشكل نهائي وإصدار الفاتورة.",
      );
    }
    await prisma.order.update({
      where: { id },
      data: { status, productionStartedAt: new Date() },
    });
  } else if (status === "DISPATCHED") {
    await prisma.order.update({
      where: { id },
      data: { status, dispatchedAt: new Date() },
    });
  } else if (status === "DELIVERED") {
    if (
      ![
        "SYSTEM_OWNER",
        "DISPATCHER",
        "FOLLOW_UP",
        "MANAGER",
        "COMPANY_ADMIN",
      ].includes(role)
    ) {
      throw new Error("غير مصرح لك بإنهاء الطلبية كـ تم التوصيل.");
    }
    await prisma.order.update({
      where: { id },
      data: { status },
    });
  } else {
    // Other status updates
    await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  // Create audit log for all status changes to track who did what
  if (status !== "CANCELLED" && status !== "REJECTED") {
    const STATUS_AR: Record<string, string> = {
      PENDING: "بانتظار الموافقة",
      PENDING_APPROVAL: "بانتظار الموافقة",
      APPROVED: "موافقة",
      SUBMITTED: "بانتظار المختبر",
      LAB_APPROVED: "موافقة المختبر",
      PRODUCTION: "قيد الإنتاج",
      DISPATCHED: "تم الإرسال",
      DELIVERED: "تم التوصيل",
    };
    const statusAr = STATUS_AR[status] || status;

    await prisma.auditLog.create({
      data: {
        companyId,
        userId: user.id,
        action: `STATUS_${status}`,
        role,
        entity: "Order",
        entityId: String(id),
        newStatus: status,
        details: `تم تحديث حالة الطلب إلى ${statusAr}`,
      },
    });
  }

  revalidatePath("/system/orders");
  revalidatePath("/system/sales/orders");
  revalidatePath(`/system/orders/details/${id}`);
}

export async function updateOrderDeliveryDate(id: number, date: Date) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const companyId = user.companyId || 1;

  if (user.companyId) {
    await enforceSubscription(user.companyId);
  }

  const role =
    typeof user.role === "string"
      ? user.role
      : (user.role as { name: string }).name;
  checkPermission(role, "MANAGE");

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order || order.companyId !== companyId) {
    throw new Error("Order not found or access denied");
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { date },
  });

  revalidatePath("/system/orders");
  revalidatePath("/system/sales/orders");
  revalidatePath(`/system/orders/details/${id}`);

  return { success: true, order: updatedOrder };
}

// -- Helpers for Dropdowns --

export async function getOrderFormData() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { customers: [], projects: [], mixes: [] };

  const [customers, projects, mixes] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: user.companyId, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { companyId: user.companyId, status: "ACTIVE", deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.mixDesign.findMany({
      where: {
        companyId: user.companyId,
        status: "APPROVED",
        isCurrent: true,
        deletedAt: null,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return { customers, projects, mixes };
}
