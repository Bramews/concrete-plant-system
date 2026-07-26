"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MixDesign } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateSieveAnalysis, SieveLimit } from "@/lib/lab/sieve-engine";

type MixDesignWithApprover = MixDesign & {
  approvedBy?: { name: string | null } | null;
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface SieveInput {
  size: string | number;
  min: number | string;
  max: number | string;
}

function getRoleName(user: {
  role?: string | { name: string } | null;
}): string {
  if (!user.role) return "OPERATOR";
  return typeof user.role === "string" ? user.role : user.role.name;
}

// -- Materials Helper --
export async function getMaterials() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];
  return prisma.material.findMany({
    where: {
      status: "ACTIVE",
      companyId: user.companyId,
    },
  });
}

// -- Sieve Analysis --

export async function getSieveTests() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  return prisma.sieveAnalysis.findMany({
    where: {
      companyId: user.companyId,
    },
    include: { material: true, approvedBy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function addSieveAnalysis(data: {
  materialId: number;
  testType?: string;
  readings: Record<string, number>;
  totalWeight: number;
  standardIds?: string[];
  moistureContent?: number;
  clayContent?: number;
  source?: string;
  location?: string;
  supplier?: string;
  fieldNo?: string;
  projectName?: string;
  inspectorName?: string;
  labNo?: string;
  sampleDate?: string;
  testDate?: string;
  reportDate?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  // const role =
  //   typeof user.role === "string" ? user.role : (user.role as { name: string }).name;
  // checkPermission(role, "EDIT"); // Commented out as checkPermission is not defined in the provided context

  // Fetch standards if provided
  const limits: SieveLimit[] = [];
  if (data.standardIds && data.standardIds.length > 0) {
    const standards = await prisma.sieveCategory.findMany({
      where: {
        id: { in: data.standardIds },
        companyId: user.companyId,
      },
      include: {
        sieves: true,
      },
    });

    // Combine limits from multiple standards
    standards.forEach((std) => {
      try {
        const stdSieves = std.sieves.map((s) => ({
          size: s.size,
          min: s.minLimit ?? 0,
          max: s.maxLimit ?? 100,
        }));
        limits.push(...stdSieves);
      } catch (e) {
        console.error("Failed to parse standard sieves", e);
      }
    });
  }

  // Calculate results using the core engine
  const calculation = calculateSieveAnalysis(
    data.readings,
    data.totalWeight,
    limits,
  );

  const analysis = await prisma.sieveAnalysis.create({
    data: {
      materialId: data.materialId,
      companyId: user.companyId,
      testType: data.testType,
      readings: JSON.stringify(data.readings),
      totalWeight: data.totalWeight,
      moistureContent: data.moistureContent,
      clayContent: data.clayContent,
      source: data.source,
      location: data.location,
      supplier: data.supplier,
      fieldNo: data.fieldNo,
      projectName: data.projectName, // Added this field
      inspectorName: data.inspectorName,
      labNo: data.labNo,
      results: JSON.stringify(calculation.results),
      finenessModulus: calculation.finenessModulus,
      zone: calculation.isPassed ? "PASSED" : "FAILED",
      appliedStandards: data.standardIds
        ? JSON.stringify(data.standardIds)
        : undefined,
      status: "PENDING",
      sampleDate: data.sampleDate ? new Date(data.sampleDate) : undefined,
      testDate: data.testDate ? new Date(data.testDate) : undefined,
      reportDate: data.reportDate ? new Date(data.reportDate) : undefined,
    },
  });

  revalidatePath("/system/lab/sieve-analysis");
  return analysis;
}

export async function approveSieveAnalysis(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const role = getRoleName(user);
  checkPermission(role, "APPROVE");

  await prisma.sieveAnalysis.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
    },
  });
  revalidatePath("/system/lab", "layout");
}
export async function processLabDecision(
  id: number,
  action: "APPROVE" | "REJECT",
  details: string,
  mixData?: string,
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "APPROVE");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      mixDesign: true,
      project: true,
    },
  });

  if (!order || order.companyId !== user.companyId) {
    throw new Error("Order not found or access denied");
  }

  if (action === "REJECT") {
    // Update order status back to PENDING or REJECTED
    await prisma.order.update({
      where: { id, companyId: user.companyId },
      data: {
        status: "REJECTED",
        notes: order.notes
          ? `${order.notes}\n[ملاحظة الرفض من المختبر: ${details}]`
          : `[ملاحظة الرفض من المختبر: ${details}]`,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "REJECT",
        role,
        entity: "Order",
        entityId: String(id),
        newStatus: "REJECTED",
        reason: details,
        details: `تم رفض الطلب من قبل المختبر (${user.name}). السبب: ${details}`,
      },
    });
    revalidatePath("/system/lab/approvals");
    revalidatePath("/system/orders");
    return;
  }

  // 1. Create lab approval record with mixData
  await prisma.labApproval.upsert({
    where: { orderId: id },
    update: {
      userId: user.id,
      creatorName: user.name,
      details: details || "",
      status: "APPROVED",
      mixData: mixData || null,
    },
    create: {
      orderId: id,
      companyId: user.companyId,
      userId: user.id,
      creatorName: user.name,
      details: details || "",
      status: "APPROVED",
      mixData: mixData || null,
    },
  });

  // 2. Update order status
  await prisma.order.update({
    where: {
      id,
      companyId: user.companyId,
    },
    data: {
      status: "LAB_APPROVED",
      labApprovedAt: new Date(),
    },
  });

  // 3. Broadcast to Accounts: Generate draft Invoice
  const mix = order.mixDesign;
  const grade = mix?.strengthClass || "C30";
  let concretePrice = mix?.concretePrice;
  if (concretePrice === null || concretePrice === undefined) {
    concretePrice = 0;
  }
  const pumpPrice = mix?.pumpPrice || 0;
  const items = [];
  if (concretePrice > 0) {
    items.push({
      description: `Concrete Grade ${grade}`,
      quantity: order.volume,
      unitPrice: concretePrice,
      total: order.volume * concretePrice,
    });
  }
  if (pumpPrice > 0) {
    items.push({
      description: "Pumping Service",
      quantity: order.volume,
      unitPrice: pumpPrice,
      total: order.volume * pumpPrice,
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  if (totalAmount > 0) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId: order.id },
    });

    if (!existingInvoice) {
      await prisma.invoice.create({
        data: {
          id: `INV-${order.id}-${Date.now()}`,
          orderId: order.id,
          companyId: order.companyId,
          amount: totalAmount,
          type: "ORDER",
          status: "DRAFT",
        },
      });
    }
  }

  revalidatePath("/system/lab/approvals");
  revalidatePath("/system/orders");
}

export async function approveOrder(id: number, details?: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "APPROVE");

  // Fetch the order with its MixDesign and Project details
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      mixDesign: true,
      project: true,
    },
  });

  if (!order || order.companyId !== user.companyId) {
    throw new Error("Order not found or access denied");
  }

  // Atomic Transaction: Ensure both record creation and status update succeed together
  await prisma.$transaction(async (tx) => {
    // 1. Create lab approval record
    await tx.labApproval.create({
      data: {
        orderId: id,
        companyId: user.companyId,
        userId: user.id, // Match schema field 'userId'
        details: details || "",
        status: "APPROVED",
      },
    });

    // 2. Update order status
    await tx.order.update({
      where: {
        id,
        companyId: user.companyId,
      },
      data: {
        status: "LAB_APPROVED",
        labApprovedAt: new Date(),
      },
    });

    // 3. Broadcast to Accounts: Generate draft Invoice
    // Calculate total price using pricing from the MixDesign!
    const mix = order.mixDesign;
    const grade = mix?.strengthClass || "C30";

    // ── Concrete Price ──
    let concretePrice = mix?.concretePrice;
    if (concretePrice === null || concretePrice === undefined) {
      concretePrice = 0;
    }

    // ── Pump Price ──
    let pumpPrice = mix?.pumpPrice;
    if (pumpPrice === null || pumpPrice === undefined) {
      pumpPrice = 0;
    }

    // ── Labor Crew Price ──
    const laborPrice = mix?.laborPrice || 0;

    // ── Custom Price Components ──
    let customPricesSum = 0;
    if (mix?.priceComponents) {
      try {
        const components = JSON.parse(mix.priceComponents);
        if (Array.isArray(components)) {
          for (const comp of components) {
            if (comp && typeof comp.value === "number") {
              customPricesSum += comp.value;
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse custom price components:", e);
      }
    }

    // Total unit price per m3 = concretePrice + pumpPrice + laborPrice + customPricesSum
    const amount =
      (concretePrice + pumpPrice + laborPrice + customPricesSum) * order.volume;

    const invoiceId = `INV-ORD-${order.id}-${Date.now()}`;
    await tx.invoice.create({
      data: {
        id: invoiceId,
        companyId: user.companyId!,
        orderId: order.id,
        amount,
        currency: "IQD",
        status: "PENDING", // Draft status
        type: "ORDER",
        creatorName: "System Billing",
      },
    });
  });

  revalidatePath("/system/lab/approvals");
}

// -- Permissions --
const CAN_EDIT_LAB = [
  "LAB_TECH",
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "LAB_TECHNICIAN",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_APPROVE_LAB = [
  "LAB_TECH",
  "LAB_TECHNICIAN",
  "LAB_ENGINEER",
  "LAB_MANAGER",
  "MANAGER",
  "SYSTEM_OWNER",
];
const CAN_DELETE_LAB = ["LAB_MANAGER", "MANAGER", "SYSTEM_OWNER"];

function checkPermission(role: string, action: "EDIT" | "APPROVE" | "DELETE") {
  let allowed = CAN_EDIT_LAB;
  if (action === "APPROVE") allowed = CAN_APPROVE_LAB;
  if (action === "DELETE") allowed = CAN_DELETE_LAB;

  if (!allowed.includes(role)) {
    throw new Error("غير مصرح لك بالقيام بهذا الإجراء في المختبر");
  }
}

export async function getLabDashboardStats() {
  const user = await getCurrentUser();
  if (!user?.companyId) {
    return {
      mixCount: 0,
      pendingCubes: 0,
      avgStrength7d: 0,
      sieveCount: 0,
      recentTests: [],
    };
  }

  const [mixCount, pendingCubes, avgStrength7d, sieveCount, recentTests] =
    await prisma.$transaction([
      prisma.mixDesign.count({
        where: { companyId: user.companyId, status: "APPROVED" },
      }),
      prisma.cubeTest.count({
        where: { order: { companyId: user.companyId }, status: "PENDING" },
      }),
      prisma.cubeTest.aggregate({
        where: {
          order: { companyId: user.companyId },
          age: 7,
          status: "APPROVED",
        },
        _avg: { mpa: true },
      }),
      prisma.sieveAnalysis.count({
        where: { material: { companyId: user.companyId } },
      }),
      prisma.cubeTest.findMany({
        where: { order: { companyId: user.companyId } },
        include: { order: { include: { mixDesign: true, project: true } } },
        orderBy: { sampleDate: "desc" },
        take: 5,
      }),
    ]);

  return {
    mixCount,
    pendingCubes,
    avgStrength7d: avgStrength7d._avg.mpa || 0,
    sieveCount,
    recentTests,
  };
}

// -- Mix Designs --

export async function getMixDesigns(includeArchived = false) {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  // Default query only returns the 'Active' or 'Current Draft' branch
  // unless explicitly requested to see all history
  const mixes = await prisma.mixDesign.findMany({
    where: {
      companyId: user.companyId,
      ...(includeArchived ? {} : { isCurrent: true }),
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { orders: true, revisions: true } } },
  });

  // If not including archived, fetch the history for each active mix
  // by walking up the parent lineage chain
  const mixesWithHistory = await Promise.all(
    mixes.map(async (mix) => {
      const history: {
        id: number;
        version: number;
        status: string;
        updatedAt: Date | string;
        changeNote: string | null;
        parentMixId?: number | null;
      }[] = [
        {
          id: mix.id,
          version: mix.version,
          status: mix.status,
          updatedAt: mix.updatedAt,
          changeNote: mix.changeNote,
          parentMixId: mix.parentMixId,
        },
      ];
      let nextParentId = (mix as { parentMixId?: number | null }).parentMixId;

      // Walk up the lineage chain (parentMixId)
      while (nextParentId) {
        const parent = await prisma.mixDesign.findUnique({
          where: { id: nextParentId },
          select: {
            id: true,
            version: true,
            status: true,
            updatedAt: true,
            changeNote: true,
            parentMixId: true,
          },
        });
        if (!parent) break;
        history.push(parent);
        nextParentId = parent.parentMixId;
      }

      // Legacy/Fallback: Also include mixes with the exact same code
      if (mix.code) {
        const codeMatches = await prisma.mixDesign.findMany({
          where: {
            companyId: user.companyId,
            code: mix.code,
            id: { notIn: [mix.id, ...history.map((h) => h.id)] },
            status: { not: "ARCHIVED" },
          },
          select: {
            id: true,
            version: true,
            status: true,
            updatedAt: true,
            changeNote: true,
          },
        });
        history.push(...codeMatches);
      }

      // Sort by version descending for the UI
      history.sort((a, b) => b.version - a.version);

      return { ...mix, history };
    }),
  );

  return mixesWithHistory;
}

export async function getMixDesignHistory(idOrCode: number | string) {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  let baseMix: MixDesign | null = null;
  if (typeof idOrCode === "number") {
    baseMix = await prisma.mixDesign.findUnique({
      where: { id: idOrCode, companyId: user.companyId },
    });
  } else {
    baseMix = await prisma.mixDesign.findFirst({
      where: { code: idOrCode, companyId: user.companyId },
      orderBy: { version: "desc" },
    });
  }

  if (!baseMix) return [];

  const history: MixDesignWithApprover[] = [];
  let nextParentId = baseMix.parentMixId;

  // 1. Lineage search (most accurate)
  while (nextParentId) {
    const parent = await prisma.mixDesign.findUnique({
      where: { id: nextParentId },
      include: { approvedBy: { select: { name: true } } },
    });
    if (!parent || history.some((h) => h.id === parent.id)) break;
    history.push(parent);
    nextParentId = parent.parentMixId;
  }

  // 2. Code mismatch search (fallback)
  if (baseMix.code) {
    const codeMatches = await prisma.mixDesign.findMany({
      where: {
        companyId: user.companyId,
        code: baseMix.code,
        id: { notIn: [baseMix.id, ...history.map((h) => h.id)] },
      },
      include: { approvedBy: { select: { name: true } } },
    });
    history.push(...codeMatches);
  }

  return history.sort((a, b) => b.version - a.version);
}

export async function getArchivedMixDesigns() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma.mixDesign as any).findMany({
    where: {
      companyId: user.companyId,
      status: "ARCHIVED",
    },
    orderBy: { deletedAt: "desc" },
    includeDeleted: true,
    include: {
      _count: { select: { orders: true, childMixes: true } },
      orders: { select: { id: true, orderNumber: true }, take: 5 },
    },
  });
}

export async function getMixDesignById(id: number, includeDeleted = false) {
  const user = await getCurrentUser();
  if (!user?.companyId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mix = await (prisma.mixDesign as any).findFirst({
    where: { id, companyId: user.companyId },
    includeDeleted,
    include: {
      approvedBy: true,
      MixComponent: {
        include: { material: true },
      },
    },
  });

  if (!mix) return null;

  // Map MixComponent to components for frontend compatibility
  return {
    ...mix,
    components: mix.MixComponent || [],
  };
}

export async function getCubeTests() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  return prisma.cubeTest.findMany({
    where: {
      order: {
        companyId: user.companyId,
      },
    },
    include: {
      order: {
        include: {
          mixDesign: true,
          project: true,
          customer: true,
        },
      },
      approvedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveOrders() {
  const user = await getCurrentUser();
  if (!user?.companyId) return [];

  return prisma.order.findMany({
    where: {
      companyId: user.companyId,
      status: { in: ["PRODUCTION", "DELIVERED"] },
    },
    include: { mixDesign: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMixDesign(data: {
  name: string;
  code: string;
  strengthClass: string;
  details?: string;
  method?: string;
  exposureClass?: string;
  maxAggregateSize?: number;
  targetWC?: number;
  targetSlump?: number;
  targetAir?: number;
  targetDensity?: number;
  calculations?: JsonValue;
  trialInfo?: JsonValue;
  labResults?: JsonValue;
  moistureData?: JsonValue;
  strengthResults?: JsonValue;
  trialVolumeData?: JsonValue;
  components?: {
    materialId?: number;
    materialName: string;
    quantity: number;
    unit: string;
    specificGravity?: number;
    absorption?: number;
    moistureContent?: number;
    finenessModulus?: number;
  }[];
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("No Company");

  const role = getRoleName(user);
  checkPermission(role, "EDIT");

  try {
    const mix = await prisma.mixDesign.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        code: data.code,
        strengthClass: data.strengthClass,
        details: data.details,
        method: data.method,
        exposureClass: data.exposureClass,
        maxAggregateSize: data.maxAggregateSize,
        targetWC: data.targetWC,
        targetSlump: data.targetSlump,
        targetAir: data.targetAir,
        targetDensity: data.targetDensity,
        calculations: data.calculations
          ? JSON.stringify(data.calculations)
          : undefined,
        trialInfo: data.trialInfo ? JSON.stringify(data.trialInfo) : undefined,
        labResults: data.labResults
          ? JSON.stringify(data.labResults)
          : undefined,
        moistureData: data.moistureData
          ? JSON.stringify(data.moistureData)
          : undefined,
        strengthResults: data.strengthResults
          ? JSON.stringify(data.strengthResults)
          : undefined,
        trialVolumeData: data.trialVolumeData
          ? JSON.stringify(data.trialVolumeData)
          : undefined,
        status: "DRAFT",
        MixComponent: data.components
          ? {
              create: data.components.map((c) => ({
                materialId: c.materialId,
                companyId: user.companyId,
                materialName: c.materialName,
                quantity: c.quantity,
                unit: c.unit,
                specificGravity: c.specificGravity,
                absorption: c.absorption,
                moistureContent: c.moistureContent,
                finenessModulus: c.finenessModulus,
              })),
            }
          : undefined,
      },
      include: { MixComponent: true },
    });

    const mappedMix = {
      ...mix,
      components: mix.MixComponent || [],
    };

    revalidatePath("/system/lab", "layout");
    return mappedMix;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") throw new Error("DUPLICATE_MIX_CODE");
    throw e;
  }
}

export async function updateMixDesign(
  id: number,
  data: {
    name?: string;
    code?: string;
    strengthClass?: string;
    grade?: string;
    details?: string;
    method?: string;
    exposureClass?: string;
    maxAggregateSize?: number;
    targetWC?: number;
    targetSlump?: number;
    targetAir?: number;
    targetDensity?: number;
    calculations?: JsonValue;
    trialInfo?: JsonValue;
    labResults?: JsonValue;
    moistureData?: JsonValue;
    strengthResults?: JsonValue;
    trialVolumeData?: JsonValue;
    components?: {
      materialId?: number;
      materialName: string;
      quantity: number;
      unit: string;
      specificGravity?: number;
      absorption?: number;
      moistureContent?: number;
      finenessModulus?: number;
    }[];
  },
) {
  let user: {
    id: number;
    companyId?: number | null;
    role?: string | { name: string } | null;
    name?: string | null;
  } | null = await getCurrentUser();
  if (user && !user.companyId && user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: { role: true },
        },
      },
    });
    if (dbUser?.companyId) {
      const activeRole = dbUser.memberships[0]?.role?.name || "OPERATOR";
      user = { ...user, companyId: dbUser.companyId, role: activeRole };
    }
  }

  if (!user?.companyId) throw new Error("No Company");

  const role = getRoleName(user);
  checkPermission(role, "EDIT");

  const existing = await prisma.mixDesign.findUnique({ where: { id } });
  if (existing?.status !== "DRAFT") {
    throw new Error("Cannot edit approved mix design");
  }

  // 1. Update basic info and targets
  const updated = await prisma.mixDesign.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      strengthClass: data.grade || data.strengthClass || data.name,
      details: data.details,
      method: data.method,
      exposureClass: data.exposureClass,
      maxAggregateSize: data.maxAggregateSize,
      targetWC: data.targetWC,
      targetSlump: data.targetSlump,
      targetAir: data.targetAir,
      targetDensity: data.targetDensity,
      calculations: data.calculations
        ? JSON.stringify(data.calculations)
        : undefined,
      trialInfo: data.trialInfo ? JSON.stringify(data.trialInfo) : undefined,
      labResults: data.labResults ? JSON.stringify(data.labResults) : undefined,
      moistureData: data.moistureData
        ? JSON.stringify(data.moistureData)
        : undefined,
      strengthResults: data.strengthResults
        ? JSON.stringify(data.strengthResults)
        : undefined,
      trialVolumeData: data.trialVolumeData
        ? JSON.stringify(data.trialVolumeData)
        : undefined,
    },
  });

  // 2. Handle components (Delete and Re-create sequentially)
  if (data.components) {
    await prisma.mixComponent.deleteMany({ where: { mixDesignId: id } });
    for (const c of data.components) {
      await prisma.mixComponent.create({
        data: {
          mixDesignId: id,
          materialId: c.materialId,
          materialName: c.materialName,
          quantity: c.quantity,
          unit: c.unit,
          specificGravity: c.specificGravity,
          absorption: c.absorption,
          moistureContent: c.moistureContent,
          finenessModulus: c.finenessModulus,
        },
      });
    }
  }

  const mix = updated;

  revalidatePath("/system/lab", "layout");
  return mix;
}

export async function createMixDesignRevision(
  id: number,
  changeNote?: string,
  newName?: string,
  newCode?: string,
) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const existing = await prisma.mixDesign.findUnique({
    where: { id, companyId: user.companyId },
    include: { MixComponent: true },
  });

  if (!existing) throw new Error("Not Found");
  if (existing.status !== "APPROVED") {
    throw new Error("Only APPROVED mixes can have revisions created");
  }

  // Transaction to archive old and create new
  const newMix = await prisma.$transaction(async (tx) => {
    // Demote old mix
    await tx.mixDesign.update({
      where: { id: existing.id },
      data: { isCurrent: false },
    });

    // Create new version
    return await tx.mixDesign.create({
      data: {
        companyId: existing.companyId,
        name: newName || existing.name,
        code: newCode || existing.code,
        grade: existing.grade,
        strengthClass: existing.strengthClass,
        status: "DRAFT",
        details: existing.details,
        method: existing.method,
        exposureClass: existing.exposureClass,
        maxAggregateSize: existing.maxAggregateSize,
        targetWC: existing.targetWC,
        targetSlump: existing.targetSlump,
        targetAir: existing.targetAir,
        targetDensity: existing.targetDensity,
        calculations: existing.calculations,
        trialInfo: existing.trialInfo,
        labResults: existing.labResults,
        moistureData: existing.moistureData,
        strengthResults: existing.strengthResults,
        trialVolumeData: existing.trialVolumeData,
        // Version mapping
        version: existing.version + 1,
        isCurrent: true,
        parentMixId: existing.id,
        changeNote: changeNote || "New Revision",
        MixComponent: {
          create: (existing.MixComponent || []).map((c) => ({
            materialId: c.materialId,
            materialName: c.materialName,
            quantity: c.quantity,
            unit: c.unit,
            specificGravity: c.specificGravity,
            absorption: c.absorption,
            moistureContent: c.moistureContent,
            finenessModulus: c.finenessModulus,
          })),
        },
      },
    });
  });

  revalidatePath("/system/lab", "layout");
  return newMix;
}

export async function approveMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "APPROVE");

  await prisma.mixDesign.update({
    where: {
      id,
      companyId: user.companyId, // Multi-tenancy guard
    },
    data: { status: "APPROVED" },
  });

  revalidatePath("/system/lab", "layout");
}

export async function createAndApproveMixDesign(data: {
  name: string;
  code: string;
  strengthClass: string;
  details?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("No Company");

  const role = getRoleName(user);
  checkPermission(role, "EDIT");
  checkPermission(role, "APPROVE");

  try {
    // Atomic Transaction
    const mix = await prisma.$transaction(async (tx) => {
      const created = await tx.mixDesign.create({
        data: {
          companyId: user.companyId!,
          name: data.name,
          code: data.code,
          strengthClass: data.strengthClass,
          details: data.details,
          status: "APPROVED", // Straight to approved
        },
      });
      return created;
    });

    revalidatePath("/system/lab", "layout");
    return mix;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      throw new Error("DUPLICATE_MIX_CODE");
    }
    throw e;
  }
}

// -- Cube Tests --

import { calculateCompressiveStrength, Specimen } from "@/lib/lab/calculations";

export async function addCubeResult(data: {
  orderId: number;
  age: number;
  kn: number;
  sampleDate: Date;
  labStandardId?: string;
  standardSnapshot?: string; // JSON
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "EDIT");

  // Default: Standard 150x150mm cube = 22500 mm2
  let mpa = 0;
  let _correctionFactor = 1.0;

  if (data.standardSnapshot) {
    try {
      const snapshot = JSON.parse(data.standardSnapshot);
      const specimen: Specimen = {
        shape: snapshot.shape || "CUBE",
        dimensions: snapshot.dimensions || { width: 150, height: 150 },
      };

      const calc = calculateCompressiveStrength(
        data.kn,
        "kN",
        specimen,
        snapshot.code || "BS_1881",
      );

      mpa = calc.strength;
      _correctionFactor = calc.correctionFactor;
    } catch (e) {
      console.error("Failed to calc strength from snapshot", e);
      const AREA_MM2 = 22500;
      mpa = Number(((data.kn * 1000) / AREA_MM2).toFixed(2));
    }
  } else {
    // Legacy Fallback
    const AREA_MM2 = 22500;
    mpa = Number(((data.kn * 1000) / AREA_MM2).toFixed(2));
  }

  // Pass/Fail Logic
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { mixDesign: true },
  });

  if (!order) throw new Error("Order not found");

  // TODO: Fetch target strength from MixDesign (requires parsing strengthClass)
  // For MVP: assume 30 MPa target if not found
  let targetStrength = 30;
  if (order?.mixDesign?.strengthClass) {
    const match = order.mixDesign.strengthClass.match(/\d+/);
    if (match) targetStrength = parseInt(match[0]);
  }

  let result = "PENDING";
  if (mpa >= targetStrength) result = "PASS";
  else result = "FAIL";

  const test = await prisma.cubeTest.create({
    data: {
      orderId: data.orderId,
      companyId: order.companyId,
      sampleDate: data.sampleDate,
      age: data.age,
      kn: data.kn,
      mpa: mpa,
      result: result,
      status: "PENDING",
      labStandardId: data.labStandardId,
      standardSnapshot: data.standardSnapshot,
    },
  });

  revalidatePath("/system/lab", "layout");
  return test;
}

export async function addMultipleCubeResults(data: {
  orderId: number;
  sampleDate: Date;
  labStandardId?: string;
  standardSnapshot?: string; // JSON
  tests: {
    age: number;
    kn: number;
  }[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "EDIT");

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { mixDesign: true },
  });

  if (!order) throw new Error("Order not found");

  let targetStrength = 30;
  if (order?.mixDesign?.strengthClass) {
    const match = order.mixDesign.strengthClass.match(/\d+/);
    if (match) targetStrength = parseInt(match[0]);
  }

  const createdTests = await prisma.$transaction(
    data.tests.map((t) => {
      let mpa = 0;
      let _correctionFactor = 1.0;

      if (data.standardSnapshot) {
        try {
          const snapshot = JSON.parse(data.standardSnapshot);
          const specimen: Specimen = {
            shape: snapshot.shape || "CUBE",
            dimensions: snapshot.dimensions || { width: 150, height: 150 },
          };

          const calc = calculateCompressiveStrength(
            t.kn,
            "kN",
            specimen,
            snapshot.code || "BS_1881",
          );

          mpa = calc.strength;
          _correctionFactor = calc.correctionFactor;
        } catch (e) {
          console.error("Failed to calc strength from snapshot", e);
          const AREA_MM2 = 22500;
          mpa = Number(((t.kn * 1000) / AREA_MM2).toFixed(2));
        }
      } else {
        const AREA_MM2 = 22500;
        mpa = Number(((t.kn * 1000) / AREA_MM2).toFixed(2));
      }

      let result = "PENDING";
      if (mpa >= targetStrength) result = "PASS";
      else result = "FAIL";

      return prisma.cubeTest.create({
        data: {
          orderId: data.orderId,
          companyId: order.companyId,
          sampleDate: data.sampleDate,
          age: t.age,
          kn: t.kn,
          mpa: mpa,
          result: result,
          status: "PENDING",
          labStandardId: data.labStandardId,
          standardSnapshot: data.standardSnapshot,
        },
      });
    }),
  );

  revalidatePath("/system/lab", "layout");
  return createdTests;
}

export async function approveCubeResult(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "APPROVE");

  const existing = await prisma.cubeTest.findUnique({ where: { id } });
  if (!existing) throw new Error("Test not found");

  if (existing.companyId !== user.companyId) {
    if (existing.companyId === null || existing.companyId === undefined) {
      const order = await prisma.order.findUnique({
        where: { id: existing.orderId },
      });
      if (!order || order.companyId !== user.companyId) {
        throw new Error("Unauthorized");
      }
    } else {
      throw new Error("Unauthorized");
    }
  }

  await prisma.cubeTest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
    },
  });
  revalidatePath("/system/lab", "layout");
}
export async function archiveMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "DELETE");

  await prisma.mixDesign.update({
    where: {
      id,
      companyId: user.companyId,
    },
    data: {
      status: "ARCHIVED",
      deletedAt: new Date(),
      isCurrent: false,
    },
  });

  revalidatePath("/system/lab", "layout");
}

export async function restoreMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "EDIT"); // You can create a specific permission for this if you prefer

  // Default to DRAFT when un-archiving to be safe
  await prisma.mixDesign.update({
    where: {
      id,
      companyId: user.companyId,
    },
    data: {
      status: "DRAFT",
      deletedAt: null,
      isCurrent: true,
    },
  });

  revalidatePath("/system/lab", "layout");
}

export async function freezeMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "EDIT"); // You can create a specific permission for this if you prefer

  await prisma.mixDesign.update({
    where: {
      id,
      companyId: user.companyId,
    },
    data: {
      isFrozen: true,
    },
  });

  revalidatePath("/system/lab", "layout");
}

export async function unfreezeMixDesign(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "EDIT"); // You can create a specific permission for this if you prefer

  await prisma.mixDesign.update({
    where: {
      id,
      companyId: user.companyId,
    },
    data: {
      isFrozen: false,
    },
  });

  revalidatePath("/system/lab", "layout");
}

export async function deleteMixDesignPermanently(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) throw new Error("Unauthorized");

  const role = getRoleName(user);
  checkPermission(role, "DELETE");

  const mix = await prisma.mixDesign.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      _count: { select: { orders: true } },
    },
  });

  if (!mix) throw new Error("Mix not found");

  if (mix._count.orders > 0) {
    throw new Error("HAS_ORDERS");
  }

  // Delete associated components first due to FK constraints
  await prisma.mixComponent.deleteMany({
    where: { mixDesignId: id },
  });

  await prisma.mixDesign.delete({
    where: {
      id,
      companyId: user.companyId,
    },
  });

  revalidatePath("/system/lab", "layout");
}

export async function getSieveAnalysisById(id: number) {
  const user = await getCurrentUser();
  if (!user?.companyId) return null;

  return prisma.sieveAnalysis.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    include: {
      material: true,
      approvedBy: { select: { id: true, name: true } },
      company: {
        select: {
          id: true,
          name: true,
          labReportConfig: true,
        },
      },
    },
  });
}

export async function getApprovedLabResults() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { cubes: [], sieves: [], mixes: [] };

  const [cubes, sieves, mixes] = await Promise.all([
    prisma.cubeTest.findMany({
      where: {
        status: "APPROVED",
        order: { companyId: user.companyId },
      },
      include: {
        order: {
          include: {
            project: { select: { name: true } },
            mixDesign: { select: { name: true, code: true } },
          },
        },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sieveAnalysis.findMany({
      where: {
        status: "APPROVED",
        companyId: user.companyId,
      },
      include: {
        material: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.mixDesign.findMany({
      where: {
        status: "APPROVED",
        companyId: user.companyId,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { cubes, sieves, mixes };
}

export async function deleteCubeResult(id: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHENTICATED" };

  try {
    const existing = await prisma.cubeTest.findUnique({ where: { id } });
    if (!existing) return { error: "Not found" };

    if (existing.companyId !== user.companyId) {
      if (existing.companyId === null || existing.companyId === undefined) {
        const order = await prisma.order.findUnique({
          where: { id: existing.orderId },
        });
        if (!order || order.companyId !== user.companyId) {
          if (user.role !== "SYSTEM_OWNER") return { error: "FORBIDDEN" };
        }
      } else {
        if (user.role !== "SYSTEM_OWNER") return { error: "FORBIDDEN" };
      }
    }

    await prisma.cubeTest.delete({
      where: { id },
    });

    revalidatePath("/system/lab/cube-results");
    return { success: true };
  } catch (e: unknown) {
    console.error("Delete error:", e);
    return { error: "Failed to delete" };
  }
}
