"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, getSession } from "@/lib/auth";
import { requireRole } from "@/lib/auth";

// --- Types (Strict Contract) ---

export type ProductionStatus = "stable" | "warning" | "stopped";
export type MaterialsStatus = "ok" | "low" | "critical";
export type LabStatus = "clear" | "rejection_pending";

export interface OperationalPulseStrict {
  production: ProductionStatus;
  materials: MaterialsStatus;
  lab: LabStatus;
}

export interface ManagementKpis {
  dailyProduction: number;
  monthlyRevenue: number;
  pendingOrders: number;
  labHealth: number; // Percentage
}

export interface AttentionItemStrict {
  type: "LAB_REJECTION" | "ORDER_MATERIAL_CHECK";
  refId: string;
  severity: "high" | "medium" | "low";
  // We might include extra data for the UI to render details,
  // but the core identification follows the contract.
  details?: string;
  timestamp?: Date;
}

export interface SimulationResultStrict {
  result: "possible" | "risky" | "impossible";
  blockingMaterial: string | null;
  deficitKg: number;
}

// --- Actions ---

export async function getOperationalPulse(): Promise<OperationalPulseStrict> {
  // 1. RBAC Check
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  // 2. Production Logic
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // stable: Active batch < 30m
  // warning: Active batch < 2h
  // stopped: No batch > 2h
  const lastBatch = await prisma.batch.findFirst({
    where: {
      order: { companyId: user.companyId },
    },
    orderBy: { createdAt: "desc" },
  });

  let production: ProductionStatus = "stopped";
  if (lastBatch) {
    const diffMins = (Date.now() - lastBatch.createdAt.getTime()) / 1000 / 60;
    if (diffMins < 30) production = "stable";
    else if (diffMins < 120) production = "warning";
  }

  // 3. Materials Logic
  // ok: All > 10% buffer (simplified for now as > 100 units)
  // low: Any < 100
  // critical: Any < 10
  const materials = await prisma.material.findMany({
    where: {
      status: "ACTIVE",
      companyId: user.companyId,
    },
  });

  let matStatus: MaterialsStatus = "ok";
  if (materials.some((m) => m.stock < 10)) matStatus = "critical";
  else if (materials.some((m) => m.stock < 100)) matStatus = "low";

  // 4. Lab Logic
  // clear: No pending rejections
  // rejection_pending: Count > 0
  const pendingRejections = await prisma.materialRejection.count({
    where: {
      status: "PENDING",
      material: { companyId: user.companyId },
    },
  });
  const lab: LabStatus = pendingRejections > 0 ? "rejection_pending" : "clear";

  return {
    production,
    materials: matStatus,
    lab,
  };
}

export async function getAttentionItems(): Promise<AttentionItemStrict[]> {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const items: AttentionItemStrict[] = [];

  // 1. Lab Rejections
  const rejections = await prisma.materialRejection.findMany({
    where: {
      status: "PENDING",
      material: { companyId: user.companyId },
    },
    include: { material: true },
    orderBy: { createdAt: "desc" },
  });

  rejections.forEach((r) => {
    items.push({
      type: "LAB_REJECTION",
      refId: `LAB-${r.id}`, // e.g. LAB-1021
      severity: "high",
      details: `المادة: ${r.material.name} - ${r.comments}`,
      timestamp: r.createdAt,
    });
  });

  // 2. Orders Material Check
  // Logic: Orders pending approval that might have material issues?
  // For strict contract, we just fetch PENDING_APPROVAL orders.
  // 2. Orders Material Check
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING_APPROVAL", "RUNNING"] },
      companyId: user.companyId,
    }, // Check active too
    include: { customer: true, mixDesign: true }, // Include mix for deep check
    take: 10,
  });

  for (const o of pendingOrders) {
    let severity: "medium" | "high" = "medium";
    let alertDetails = `${o.customer?.name} - الكمية: ${o.volume} م³`;

    // Edge Case: Check if Order uses Rejected Material
    if (o.mixDesign?.details) {
      try {
        const proportions = JSON.parse(o.mixDesign.details);
        const usedMaterials = Object.keys(proportions);

        const conflict = await prisma.materialRejection.findFirst({
          where: {
            material: {
              name: { in: usedMaterials },
              companyId: user.companyId,
            },
            status: "PENDING",
          },
          include: { material: true },
        });

        if (conflict) {
          severity = "high";
          alertDetails = `⚠️ تنبيه حرج: الطلب يستخدم مادة مرفوضة (${conflict.material.name})`;
        }
      } catch {}
    }

    items.push({
      type: "ORDER_MATERIAL_CHECK",
      refId: `ORD-${o.id}`,
      severity: severity,
      details: alertDetails,
      timestamp: o.createdAt,
    });
  }

  return items;
}

export async function runSimulation(
  mixCode: string,
  volumeM3: number,
): Promise<SimulationResultStrict> {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // 1. Validate Input (No Write Side Effects)
  if (!mixCode || volumeM3 <= 0) {
    return {
      result: "impossible",
      blockingMaterial: "invalid_input",
      deficitKg: 0,
    };
  }

  // 2. Fetch Mix
  const mix = await prisma.mixDesign.findFirst({
    where: {
      OR: [{ code: mixCode }, { grade: mixCode }],
      status: "APPROVED",
      companyId: user.companyId,
    },
  });

  if (!mix) {
    return {
      result: "impossible",
      blockingMaterial: "mix_not_found",
      deficitKg: 0,
    };
  }

  // 3. Calculate
  let proportions: Record<string, number> = {};
  try {
    proportions = mix.details ? JSON.parse(mix.details) : {};
  } catch {
    return {
      result: "impossible",
      blockingMaterial: "mix_data_corrupt",
      deficitKg: 0,
    };
  }

  let isRisky = false;

  for (const [matName, perM3] of Object.entries(proportions)) {
    const requiredTotal = perM3 * volumeM3;

    // Fetch material stock
    const material = await prisma.material.findFirst({
      where: {
        name: matName,
        companyId: user.companyId,
      },
    });

    if (!material) {
      return {
        result: "impossible",
        blockingMaterial: `ERR_MAT_MISSING_${matName}`,
        deficitKg: requiredTotal,
      };
    }

    const currentStock = material.stock;

    // Explicit Zero Stock Handler
    if (currentStock <= 0) {
      return {
        result: "impossible",
        blockingMaterial: `ERR_STOCK_ZERO_${matName}`,
        deficitKg: requiredTotal,
      };
    }

    const deficit = requiredTotal - currentStock;

    if (deficit > 0) {
      return {
        result: "impossible",
        blockingMaterial: matName,
        deficitKg: deficit,
      };
    }

    // Check for Risky (< 10% buffer after usage)
    const remaining = currentStock - requiredTotal;
    // Heuristic: If remaining is less than 10% of what we just used (thin margin) OR hard limit like < 500kg
    if (remaining < requiredTotal * 0.1 || remaining < 500) {
      isRisky = true;
    }
  }

  // ... simulation logic ...

  // Audit Log (Fire and Forget)
  await safeAuditLog(
    "SIMULATION_RUN",
    0,
    `Mix: ${mixCode}, Vol: ${volumeM3}, Result: ${isRisky ? "RISky" : "Possible"}`,
  );

  if (isRisky) {
    return { result: "risky", blockingMaterial: null, deficitKg: 0 };
  }

  return { result: "possible", blockingMaterial: null, deficitKg: 0 };
}

export async function createManagerOrder(data: {
  customerId: number;
  mixCode: string;
  volume: number;
  projectId: number;
  date: Date;
}) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  // 1. Strict Validation
  if (
    !data.customerId ||
    !data.mixCode ||
    data.volume <= 0 ||
    !data.projectId
  ) {
    throw new Error("Invalid Order Data");
  }

  // 2. Resolve Mix (Must be Approved)
  const mix = await prisma.mixDesign.findFirst({
    where: {
      OR: [{ code: data.mixCode }, { grade: data.mixCode }],
      status: "APPROVED",
      companyId: (await getCurrentUser())!.companyId!, // Ensure mix belongs to company
    },
  });

  if (!mix) {
    throw new Error("ERR_MIX_NOT_FOUND_OR_NOT_APPROVED");
  }

  const orderNumber =
    "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();

  // 3. Create Order (Status: PENDING_APPROVAL by default for Manager created orders)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      companyId: (await getCurrentUser())!.companyId!, // Assumes user implies company context
      customerId: data.customerId,
      projectId: data.projectId,
      mixDesignId: mix.id,
      volume: data.volume,
      date: data.date,
      status: "PENDING_APPROVAL",
      createdById: (await getCurrentUser())!.id,
    },
  });

  // 4. Log
  await safeAuditLog(
    "ORDER_CREATE",
    order.id,
    `Created Order ${order.orderNumber}`,
  );

  return order;
}

export async function acknowledgeLabNotification(
  refId: string,
): Promise<boolean> {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  // refId format: LAB-{id}
  if (!refId.startsWith("LAB-")) {
    throw new Error("Invalid Reference ID");
  }

  const id = parseInt(refId.replace("LAB-", ""));
  if (isNaN(id)) throw new Error("Invalid ID");

  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // Strict ACK only. No editing.
  try {
    await prisma.materialRejection.update({
      where: {
        id,
        material: { companyId: user.companyId }, // Security: only ack own rejections
      },
      data: {
        status: "APPROVED", // Mapped to 'Acknowledged' in this context
        managerUserId: user!.id,
      },
    });

    // Audit Log
    await safeAuditLog("LAB_ACK", id, "Acknowledged Lab Rejection");

    return true;
  } catch {
    return false;
  }
}

// --- Orders API (Strict View/Create) ---

export async function getManagerOrders(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  // 1. Strict Validation
  const VALID_STATUSES = [
    "ALL",
    "PENDING_APPROVAL",
    "RUNNING",
    "COMPLETED",
    "REJECTED",
  ];

  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS_QUERY"); // سيتم التقاطها كـ 400 في الواجهة
  }

  const safeStatus = status || "ALL";
  const user = (await getSession()) as {
    companyId?: number | null;
    id?: number;
    role?: string;
  } | null;

  await safeAuditLog(
    "ORDER_VIEW",
    0,
    `Viewed Orders List (Page: ${page}, Status: ${safeStatus})`,
  );

  if (!user?.companyId) throw new Error("NO_COMPANY_CONTEXT");

  const where: {
    companyId: number;
    status: { not: string } | string;
  } = {
    companyId: user.companyId as number, // إضافة عزل المستأجر الصريح
    status: { not: "ARCHIVED" },
  };

  if (safeStatus !== "ALL") {
    where.status = safeStatus;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const skip = (page - 1) * pageSize;

  const [orders, totalCount, pendingCount, todayCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], // ترتيب زمني + معرف ثابت
      skip,
      take: pageSize,
      include: { customer: true, project: true, mixDesign: true },
    }),
    prisma.order.count({ where }),
    prisma.order.count({
      where: { companyId: user.companyId, status: "PENDING_APPROVAL" },
    }),
    prisma.order.count({
      where: { companyId: user.companyId, createdAt: { gte: startOfDay } },
    }),
  ]);

  return {
    orders,
    totalCount,
    stats: {
      total: totalCount,
      pending: pendingCount,
      today: todayCount,
    },
  };
}

export async function getManagementKpis(
  companyId: number,
): Promise<ManagementKpis> {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    dailyOutput,
    monthlyInvoices,
    pendingOrders,
    totalTests,
    approvedTests,
  ] = await Promise.all([
    // 1. Daily Production Volume
    prisma.batch
      .aggregate({
        where: {
          order: { companyId },
          createdAt: { gte: startOfToday },
        },
        _sum: { quantity: true },
      })
      .then((res) => res._sum.quantity || 0),

    // 2. Monthly Revenue (Paid or Pending Invoices)
    prisma.invoice
      .aggregate({
        where: {
          companyId,
          createdAt: { gte: startOfToday }, // Using today for simplicity in a "pulse", or month if needed
        },
        _sum: { amount: true },
      })
      .then((res) => res._sum.amount || 0),

    // 3. Pending Orders
    prisma.order.count({
      where: { companyId, status: "PENDING_APPROVAL" },
    }),

    // 4. Lab Health (Quality tests success rate)
    prisma.qualityTest.count({
      where: { order: { companyId }, createdAt: { gte: startOfMonth } },
    }),
    prisma.qualityTest.count({
      where: {
        order: { companyId },
        result: "PASS",
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  const labHealth = totalTests > 0 ? (approvedTests / totalTests) * 100 : 100;

  return {
    dailyProduction: dailyOutput,
    monthlyRevenue: monthlyInvoices,
    pendingOrders,
    labHealth,
  };
}

// Helper: Safe Audit Log (No Fail)
async function safeAuditLog(
  action: string,
  entityId: number | string,
  details: string,
) {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // Check if AuditLog table has specific fields based on schema
    // Using a generic create for now, adhering to schema provided earlier:
    // userId, action, entity, entityId, details, timestamp

    await prisma.auditLog.create({
      data: {
        userId: user.id, // Nullable in schema but we have user here
        action: "MANAGER_ACTION",
        entity: action, // e.g., SIMULATION_RUN
        entityId: typeof entityId === "number" ? String(entityId) : "0",
        details:
          typeof entityId === "string"
            ? `${details} [ID: ${entityId}] [${action}]`
            : `${details} [${action}]`,
        role: typeof user.role === "string" ? user.role : "MANAGER",
      },
    });
  } catch (e) {
    // Silent fail to not block main thread
    console.error("Audit Log Failed", e);
  }
}

export async function updateMixPricing(
  id: number,
  prices: {
    concretePrice?: number | null;
    pumpPrice?: number | null;
    laborPrice?: number | null;
    priceComponents?: string | null;
  },
) {
  await requireRole(["MANAGER", "SYSTEM_OWNER", "COMPANY_ADMIN"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const mix = await prisma.mixDesign.findUnique({
    where: { id, companyId: user.companyId },
  });
  if (!mix) throw new Error("Mix design not found");

  await prisma.mixDesign.update({
    where: { id },
    data: {
      concretePrice:
        prices.concretePrice !== undefined ? prices.concretePrice : undefined,
      pumpPrice: prices.pumpPrice !== undefined ? prices.pumpPrice : undefined,
      laborPrice:
        prices.laborPrice !== undefined ? prices.laborPrice : undefined,
      priceComponents:
        prices.priceComponents !== undefined
          ? prices.priceComponents
          : undefined,
    },
  });

  return { success: true };
}

export async function getTodayEfficiency() {
  try {
    const user = await getCurrentUser();
    if (!user?.companyId) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const batches = await prisma.batch.findMany({
      where: { companyId: user.companyId, createdAt: { gte: today } },
      include: { order: { select: { volume: true } } },
    });
    if (batches.length === 0) return 0;
    const produced = batches.reduce((s, b) => s + b.quantity, 0);
    const planned = batches.reduce((s, b) => s + (b.order?.volume || 0), 0);
    if (planned === 0) return 0;
    return Math.min(Math.round((produced / planned) * 100), 100);
  } catch {
    return 0;
  }
}

export async function searchEverything(query: string) {
  try {
    await requireRole(["MANAGER", "SYSTEM_OWNER"]);
    const user = await getCurrentUser();
    if (!user?.companyId) throw new Error("Unauthorized");

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        materials: [],
        projects: [],
        customers: [],
        mixDesigns: [],
        cubeTests: [],
        sieveAnalyses: [],
      };
    }

    const [
      materials,
      projects,
      customers,
      mixDesigns,
      cubeTests,
      sieveAnalyses,
    ] = await Promise.all([
      // 1. Materials
      prisma.material.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          OR: [
            { name: { contains: cleanQuery } },
            { code: { contains: cleanQuery } },
          ],
        },
        take: 5,
      }),
      // 2. Projects
      prisma.project.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          OR: [
            { name: { contains: cleanQuery } },
            { location: { contains: cleanQuery } },
          ],
        },
        take: 5,
      }),
      // 3. Customers
      prisma.customer.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          OR: [
            { name: { contains: cleanQuery } },
            { phone: { contains: cleanQuery } },
            { email: { contains: cleanQuery } },
          ],
        },
        take: 5,
      }),
      // 4. Mix Designs
      prisma.mixDesign.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null,
          OR: [
            { name: { contains: cleanQuery } },
            { code: { contains: cleanQuery } },
            { grade: { contains: cleanQuery } },
          ],
        },
        take: 5,
      }),
      // 5. Cube Tests
      prisma.cubeTest.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { result: { contains: cleanQuery } },
            { status: { contains: cleanQuery } },
            { order: { orderNumber: { contains: cleanQuery } } },
            { order: { customer: { name: { contains: cleanQuery } } } },
          ],
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              customer: { select: { name: true } },
            },
          },
        },
        take: 5,
      }),
      // 6. Sieve Analyses
      prisma.sieveAnalysis.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { supplier: { contains: cleanQuery } },
            { projectName: { contains: cleanQuery } },
            { material: { name: { contains: cleanQuery } } },
            { zone: { contains: cleanQuery } },
          ],
        },
        include: {
          material: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

    return {
      materials,
      projects,
      customers,
      mixDesigns,
      cubeTests,
      sieveAnalyses,
    };
  } catch (error) {
    console.error("Search everything failed:", error);
    return {
      materials: [],
      projects: [],
      customers: [],
      mixDesigns: [],
      cubeTests: [],
      sieveAnalyses: [],
    };
  }
}

export async function getCustomerDetails(id: number) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId, deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          project: { select: { name: true } },
          mixDesign: { select: { code: true } },
        },
      },
    },
  });

  return customer;
}

export async function getProjectDetails(id: number) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id, companyId: user.companyId, deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          mixDesign: { select: { code: true } },
        },
      },
    },
  });

  return project;
}

export async function getMixDesignDetails(id: number) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const mixDesign = await prisma.mixDesign.findFirst({
    where: { id, companyId: user.companyId, deletedAt: null },
    include: {
      MixComponent: {
        include: {
          material: { select: { name: true, unit: true } },
        },
      },
    },
  });

  return mixDesign;
}

export async function getCubeTestDetails(id: number) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const cubeTest = await prisma.cubeTest.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      order: {
        include: {
          customer: { select: { name: true } },
          project: { select: { name: true } },
          mixDesign: { select: { code: true, name: true } },
        },
      },
      labStandard: { select: { name: true } },
    },
  });

  return cubeTest;
}

export async function getSieveAnalysisDetails(id: number) {
  await requireRole(["MANAGER", "SYSTEM_OWNER"]);
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const sieveAnalysis = await prisma.sieveAnalysis.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      material: { select: { name: true, code: true } },
    },
  });

  return sieveAnalysis;
}

export async function broadcastCompanyMessage(message: string) {
  await requireRole(["MANAGER", "COMPANY_ADMIN"]);
  const user = await getCurrentUser();
  if (!user?.companyId) {
    return {
      success: false,
      error: "لم يتم تحديد معرّف الشركة للمستخدم الحالي.",
    };
  }

  try {
    const key = "COMPANY_BROADCAST_MESSAGE";

    // Store message in CompanySetting
    await prisma.companySetting.upsert({
      where: {
        companyId_key: {
          companyId: user.companyId,
          key,
        },
      },
      update: { value: message },
      create: {
        companyId: user.companyId,
        key,
        value: message,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "COMPANY_BROADCAST",
        details: `Broadcasted company message: ${message}`,
        entity: "CompanySetting",
        entityId: "0",
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
        timestamp: new Date(),
      },
    });

    // 📢 Emit real-time live event to all connected SSE clients of this company
    const { sseEmitter } = await import("@/lib/network/emitter");
    sseEmitter.emit("broadcast", {
      type: "EVENT",
      event: "COMPANY_BROADCAST",
      companyId: user.companyId,
      data: { message },
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("broadcastCompanyMessage error:", error);
    return {
      success: false,
      error: (error as Error).message || "فشل بث الرسالة",
    };
  }
}
